using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Users;
using Selu383.SP25.P03.Api.Services;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<User> userManager;
        private readonly RoleManager<Role> roleManager;
        private readonly DataContext dataContext;
        private readonly IEmailService emailService;
        private DbSet<Role> roles;

        public UsersController(
            RoleManager<Role> roleManager,
            UserManager<User> userManager,
            DataContext dataContext,
            IEmailService emailService)
        {
            this.roleManager = roleManager;
            this.userManager = userManager;
            this.dataContext = dataContext;
            this.emailService = emailService;
            roles = dataContext.Set<Role>();
        }

        [HttpPost]
        //[Authorize]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!dto.Roles.Any() || !dto.Roles.All(x => roles.Any(y => x == y.Name)))
            {
                return BadRequest();
            }

            var user = new User 
            { 
                UserName = dto.Username,
                Email = dto.Email,   
                Phone = dto.Phone    
            };

            var result = await userManager.CreateAsync(user, dto.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(user, dto.Roles); 
                return new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Roles = dto.Roles,
                    Email = user.Email,
                    Phone = user.Phone
                };
            }
            return BadRequest();
        }

        
        [HttpPut("{id}/contact")]
        public async Task<ActionResult<UserDto>> UpdateContactInfo(int id, [FromBody] UpdateContactInfoDto dto)
        {
            var user = await userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound();
            }

            
            user.Phone = dto.Phone; // (no verification needed)

            var result = await userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Roles = (await userManager.GetRolesAsync(user)).ToArray(),
                    Email = user.Email,
                    Phone = user.Phone
                };
            }

            return BadRequest(result.Errors);
        }

        // Request email change (sends verification email)
        [HttpPost("{id}/request-email-change")]
        public async Task<ActionResult> RequestEmailChange(int id, [FromBody] RequestEmailChangeDto dto)
        {
            var user = await userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound();
            }

            // Check if email is already in use
            var existingUser = await userManager.FindByEmailAsync(dto.NewEmail);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest("Email is already in use");
            }

            // Generate verification token
            var token = Guid.NewGuid().ToString() + Guid.NewGuid().ToString();
            token = token.Replace("-", "");

            // Create pending change request
            var pendingChange = new PendingChangeRequest
            {
                UserId = user.Id,
                Token = token,
                ChangeType = "Email",
                NewEmail = dto.NewEmail,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            dataContext.PendingChangeRequests.Add(pendingChange);
            await dataContext.SaveChangesAsync();

            // Send verification email to the NEW email address
            await emailService.SendEmailChangeVerificationAsync(
                dto.NewEmail, 
                user.UserName ?? "User", 
                token, 
                dto.NewEmail
            );

            return Ok(new { message = "Verification email sent. Please check your new email address to confirm the change." });
        }

        // Request password change (sends verification email)
        [HttpPost("{id}/request-password-change")]
        public async Task<ActionResult> RequestPasswordChange(int id, [FromBody] RequestPasswordChangeDto dto)
        {
            var user = await userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound();
            }

            // Verify current password
            var isCurrentPasswordValid = await userManager.CheckPasswordAsync(user, dto.CurrentPassword);
            if (!isCurrentPasswordValid)
            {
                return BadRequest("Current password is incorrect");
            }

            // Generate verification token
            var token = Guid.NewGuid().ToString() + Guid.NewGuid().ToString();
            token = token.Replace("-", "");

            // Create pending change request
            var pendingChange = new PendingChangeRequest
            {
                UserId = user.Id,
                Token = token,
                ChangeType = "Password",
                NewPassword = dto.NewPassword,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            dataContext.PendingChangeRequests.Add(pendingChange);
            await dataContext.SaveChangesAsync();

            // Send verification email to the CURRENT email address
            if (!string.IsNullOrEmpty(user.Email))
            {
                await emailService.SendPasswordChangeVerificationAsync(
                    user.Email, 
                    user.UserName ?? "User", 
                    token
                );
            }

            return Ok(new { message = "Verification email sent. Please check your email to confirm the password change." });
        }

        // Verify and apply email change
        [HttpPost("verify-email-change")]
        public async Task<ActionResult> VerifyEmailChange([FromBody] VerifyChangeDto dto)
        {
            var pendingChange = await dataContext.PendingChangeRequests
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Token == dto.Token && p.ChangeType == "Email");

            if (pendingChange == null)
            {
                return BadRequest("Invalid or expired verification token");
            }

            if (pendingChange.ExpiresAt < DateTime.UtcNow)
            {
                dataContext.PendingChangeRequests.Remove(pendingChange);
                await dataContext.SaveChangesAsync();
                return BadRequest("Verification token has expired");
            }

            var user = pendingChange.User;
            user.Email = pendingChange.NewEmail;

            var result = await userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                // Remove the pending change request
                dataContext.PendingChangeRequests.Remove(pendingChange);
                await dataContext.SaveChangesAsync();

                return Ok(new { message = "Email address updated successfully!" });
            }

            return BadRequest(result.Errors);
        }

        // Verify and apply password change
        [HttpPost("verify-password-change")]
        public async Task<ActionResult> VerifyPasswordChange([FromBody] VerifyChangeDto dto)
        {
            var pendingChange = await dataContext.PendingChangeRequests
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Token == dto.Token && p.ChangeType == "Password");

            if (pendingChange == null)
            {
                return BadRequest("Invalid or expired verification token");
            }

            if (pendingChange.ExpiresAt < DateTime.UtcNow)
            {
                dataContext.PendingChangeRequests.Remove(pendingChange);
                await dataContext.SaveChangesAsync();
                return BadRequest("Verification token has expired");
            }

            var user = pendingChange.User;
            
            // Generate a password reset token and use it to change the password
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var result = await userManager.ResetPasswordAsync(user, resetToken, pendingChange.NewPassword!);

            if (result.Succeeded)
            {
                // Remove the pending change request
                dataContext.PendingChangeRequests.Remove(pendingChange);
                await dataContext.SaveChangesAsync();

                return Ok(new { message = "Password updated successfully!" });
            }

            return BadRequest(result.Errors);
        }

        [HttpGet]
        public async Task<ActionResult<List<BasicUserDto>>> GetUsers()
        {
            try
            {
                var users = await userManager.Users.ToListAsync();
                var basicUserDtos = new List<BasicUserDto>();

                foreach (var user in users)
                {
                    basicUserDtos.Add(new BasicUserDto
                    {
                        Id = user.Id,
                        UserName = user.UserName,
                        Email = user.Email,
                        Phone = user.Phone
                    });
                }

                return Ok(basicUserDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving users");
            }
        }

        // Clean up expired tokens 
        [HttpPost("cleanup-expired-tokens")]
        public async Task<ActionResult> CleanupExpiredTokens()
        {
            var expired = await dataContext.PendingChangeRequests
                .Where(p => p.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            dataContext.PendingChangeRequests.RemoveRange(expired);
            await dataContext.SaveChangesAsync();

            return Ok(new { cleanedUp = expired.Count });
        }

        public class UpdateContactInfoDto
        {
            public string? Email { get; set; } // Note: Email changes now require verification
            public string? Phone { get; set; }
        }

        public class UpdateCredentialsDto
        {
            public string? UserName { get; set; }
            public string? CurrentPassword { get; set; }
            public string? NewPassword { get; set; }
        }

        public class BasicUserDto
        {
            public int Id { get; set; }
            public string? UserName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
        }
    }
}