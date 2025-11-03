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

            user.Email = dto.Email;
            user.Phone = dto.Phone;

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

        public class UpdateContactInfoDto
        {
            public string? Email { get; set; }
            public string? Phone { get; set; }
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

        public class BasicUserDto
        {
            public int Id { get; set; }
            public string? UserName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
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

        public class ResendVerificationDto
        {
            public string Email { get; set; } = string.Empty;
        }

    }
}
