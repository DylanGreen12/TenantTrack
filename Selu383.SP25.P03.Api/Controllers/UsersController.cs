using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Users;

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

        public UsersController(
            RoleManager<Role> roleManager,
            UserManager<User> userManager,
            DataContext dataContext)
        {
            this.roleManager = roleManager;
            this.userManager = userManager;
            this.dataContext = dataContext;
            roles = dataContext.Set<Role>();
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!dto.Roles.Any() || !dto.Roles.All(x => roles.Any(y => x == y.Name)))
            {
                return BadRequest();
            }

            var result = await userManager.CreateAsync(new User { UserName = dto.Username }, dto.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(await userManager.FindByNameAsync(dto.Username), dto.Roles);

                var user = await userManager.FindByNameAsync(dto.Username);
                return new UserDto
                {
                    Id = user.Id,
                    UserName = dto.Username,
                    Roles = dto.Roles,
                    Email = dto.Email,
                    Phone = dto.Phone
                };
            }
            return BadRequest();
        }


        [HttpPut("{id}/contact")]
        [Authorize]
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

    }
}
