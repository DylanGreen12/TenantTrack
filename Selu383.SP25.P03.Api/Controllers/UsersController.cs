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
        private DbSet<Role> roles;
        private readonly IEmailService emailService;

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
        //[Authorize]
        public async Task<ActionResult<UserDto>> UpdateContactInfo(int id, [FromBody] UpdateContactInfoDto dto)
        {
            var user = await userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound();
            }

            var oldEmail = user.Email; // Store old email for notification

            user.Email = dto.Email;
            user.Phone = dto.Phone;

            var result = await userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                // Send email change confirmation if email was changed
                if (!string.IsNullOrEmpty(oldEmail) && oldEmail != dto.Email && !string.IsNullOrEmpty(dto.Email))
                {
                    try
                    {
                        await emailService.SendEmailChangeConfirmationAsync(
                            dto.Email, 
                            user.UserName ?? "User", 
                            oldEmail ?? "previous email", 
                            dto.Email
                        );
                    }
                    catch (Exception ex)
                    {
                        // Log email failure but don't fail the request
                        Console.WriteLine($"Failed to send email confirmation: {ex.Message}");
                    }
                }

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

                // Send password change confirmation email
                if (!string.IsNullOrEmpty(user.Email))
                {
                    try
                    {
                        await emailService.SendPasswordChangeConfirmationAsync(
                            user.Email, 
                            user.UserName ?? "User"
                        );
                    }
                    catch (Exception ex)
                    {
                        // Log email failure but don't fail the request
                        Console.WriteLine($"Failed to send password change email: {ex.Message}");
                        // You could also use ILogger here for proper logging
                    }
                }
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

        public class UpdateContactInfoDto
        {
            public string? Email { get; set; }
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