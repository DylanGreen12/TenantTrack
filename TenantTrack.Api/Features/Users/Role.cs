using Microsoft.AspNetCore.Identity;

namespace TenantTrack.Api.Features.Users
{
    public class Role : IdentityRole<int>
    {
        public virtual ICollection<UserRole> UserRoles { get; } = new List<UserRole>();
    }
}
