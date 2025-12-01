using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/authentication")]
    public class AuthenticationController : ControllerBase
    {
        private readonly SignInManager<User> signInManager;
        private readonly UserManager<User> userManager;
        private readonly DataContext dataContext;
        private DbSet<User> users;

        public AuthenticationController(SignInManager<User> signInManager, UserManager<User> userManager, DataContext dataContext)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this.dataContext = dataContext;
            users = dataContext.Set<User>();
        }

        [HttpPost]
        [Route("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] LoginDto dto)
        {
            var user = await userManager.FindByNameAsync(dto.UserName);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid username or password" });
            }

            // Check if email is verified (only if email is provided)
            if (!string.IsNullOrEmpty(user.Email) && !user.EmailConfirmed)
            {
                return BadRequest(new { message = "Please verify your email before logging in", requiresVerification = true });
            }

            var result = await signInManager.PasswordSignInAsync(dto.UserName, dto.Password, false, false);
            if (result.Succeeded)
            {
                return new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Roles = (await userManager.GetRolesAsync(user)).ToArray()
                };
            }
            return BadRequest(new { message = "Invalid username or password" });
        }

        [HttpGet]
        [Route("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> Me()
        {
            var user = await userManager.GetUserAsync(User);
            if (user == null)
            {
                return BadRequest();
            }
            return new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Phone = user.Phone,
                Roles = (await userManager.GetRolesAsync(user)).ToArray()
            };
        }

        [HttpPost]
        [Route("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            await signInManager.SignOutAsync();
            return Ok();
        }
    }
}
