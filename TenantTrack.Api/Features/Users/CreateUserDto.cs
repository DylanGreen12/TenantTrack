using Microsoft.Identity.Client;

namespace TenantTrack.Api.Features.Users
{
    public class CreateUserDto
    {
        public required string Username { get; set; }

        public required string Password { get; set; }

        public string[]? Roles { get; set; }
    }
}
