using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Users;
using Selu383.SP25.P03.Api.Features.Email;

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
                Phone = dto.Phone,
                EmailConfirmed = false
            };

            // Generate email verification token
            if (!string.IsNullOrEmpty(dto.Email))
            {
                user.EmailVerificationToken = Guid.NewGuid().ToString();
                user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            }

            var result = await userManager.CreateAsync(user, dto.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(user, dto.Roles);

                // Send verification email if email is provided
                if (!string.IsNullOrEmpty(dto.Email) && user.EmailVerificationToken != null)
                {
                    try
                    {
                        await emailService.SendVerificationEmailAsync(
                            dto.Email,
                            dto.Username,
                            user.EmailVerificationToken
                        );
                    }
                    catch (Exception ex)
                    {
                        // Log email error but don't fail user creation
                        Console.WriteLine($"Failed to send verification email: {ex.Message}");
                    }
                }

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
        //[Authorize]
        public async Task<ActionResult<UserDto>> UpdateContactInfo(int id, [FromBody] UpdateContactInfoDto dto)
        {
            var user = await userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound();
            }

            // Only allow phone updates without verification
            if (!string.IsNullOrEmpty(dto.Phone) && dto.Phone != user.Phone)
            {
                user.Phone = dto.Phone;
            }

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

        [HttpPut("{id}/credentials")]
        //[Authorize]
        public async Task<ActionResult<UserDto>> UpdateCredentials(int id, [FromBody] UpdateCredentialsDto dto)
        {
            var user = await userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound();
            }

            // Verify current password if changing password
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                if (string.IsNullOrEmpty(dto.CurrentPassword))
                {
                    return BadRequest("Current password is required to set a new password");
                }

                var isCurrentPasswordValid = await userManager.CheckPasswordAsync(user, dto.CurrentPassword);
                if (!isCurrentPasswordValid)
                {
                    return BadRequest("Current password is incorrect");
                }
            }

            var changesMade = false;

            // Update username if provided and different
            if (!string.IsNullOrEmpty(dto.UserName) && dto.UserName != user.UserName)
            {
                var userNameResult = await userManager.SetUserNameAsync(user, dto.UserName);
                if (!userNameResult.Succeeded)
                {
                    return BadRequest(userNameResult.Errors);
                }
                changesMade = true;
            }

            // Update password if provided
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                var passwordResult = await userManager.ChangePasswordAsync(user, dto.CurrentPassword!, dto.NewPassword);
                if (!passwordResult.Succeeded)
                {
                    return BadRequest(passwordResult.Errors);
                }
                changesMade = true;
            }

            if (!changesMade)
            {
                return BadRequest("No changes were made");
            }

            // Return updated user info
            var updatedUser = await userManager.FindByIdAsync(id.ToString());
            return new UserDto
            {
                Id = updatedUser!.Id,
                UserName = updatedUser.UserName,
                Roles = (await userManager.GetRolesAsync(updatedUser)).ToArray(),
                Email = updatedUser.Email,
                Phone = updatedUser.Phone
            };
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
            try
            {
                await emailService.SendEmailChangeVerificationAsync(
                    dto.NewEmail,
                    user.UserName ?? "User",
                    token,
                    dto.NewEmail
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email change verification: {ex.Message}");
                // Don't fail the request, just log the error
            }

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

            // Validate new password against password policy
            var passwordValidator = new PasswordValidator<User>();
            var validationResult = await passwordValidator.ValidateAsync(userManager, user, dto.NewPassword);
            if (!validationResult.Succeeded)
            {
                var errorMessages = string.Join("; ", validationResult.Errors.Select(e => e.Description));
                return BadRequest(new { message = errorMessages });
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
                try
                {
                    await emailService.SendPasswordChangeVerificationAsync(
                        user.Email,
                        user.UserName ?? "User",
                        token
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send password change verification: {ex.Message}");
                    // Don't fail the request, just log the error
                }
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
            
            // Find tenant with matching email and update it
            var tenant = await dataContext.Tenants
                .FirstOrDefaultAsync(t => t.Email == user.Email);
                
            if (tenant != null)
            {
                tenant.Email = pendingChange.NewEmail;
                dataContext.Tenants.Update(tenant);
            }

            // Update user email
            user.Email = pendingChange.NewEmail;
            user.EmailConfirmed = true; // Since they verified the new email

            var result = await userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                // Remove the pending change request
                dataContext.PendingChangeRequests.Remove(pendingChange);
                await dataContext.SaveChangesAsync();

                return Ok(new { message = "Email address updated successfully!" });
            }

            var errorMessages = string.Join("; ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = errorMessages });
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

            var errorMessages = string.Join("; ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = errorMessages });
        }

        [HttpGet]
        //[Authorize]
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

        [HttpGet("verify-email")]
        public async Task<ActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { message = "Verification token is required" });
            }

            var user = await userManager.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

            if (user == null)
            {
                return BadRequest(new { message = "Invalid verification token" });
            }

            if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Verification token has expired" });
            }

            user.EmailConfirmed = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiry = null;

            var result = await userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new { message = "Email verified successfully" });
            }

            return StatusCode(500, new { message = "Failed to verify email" });
        }

        [HttpPost("resend-verification")]
        public async Task<ActionResult> ResendVerificationEmail([FromBody] ResendVerificationDto dto)
        {
            var user = await userManager.FindByEmailAsync(dto.Email);

            if (user == null)
            {
                // Don't reveal if email exists
                return Ok(new { message = "If the email exists, a verification email will be sent" });
            }

            if (user.EmailConfirmed)
            {
                return BadRequest(new { message = "Email is already verified" });
            }

            // Generate new token
            user.EmailVerificationToken = Guid.NewGuid().ToString();
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

            var result = await userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                try
                {
                    await emailService.SendVerificationEmailAsync(
                        user.Email!,
                        user.UserName!,
                        user.EmailVerificationToken
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send verification email: {ex.Message}");
                }
            }

            return Ok(new { message = "If the email exists, a verification email will be sent" });
        }

        public class UpdateContactInfoDto
        {
            public string? Phone { get; set; } // Note: Phone doesnt req verification
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

        public class ResendVerificationDto
        {
            public string Email { get; set; } = string.Empty;
        }
    }
}