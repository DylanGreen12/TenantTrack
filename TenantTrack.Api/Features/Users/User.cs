using Microsoft.AspNetCore.Identity;

namespace TenantTrack.Api.Features.Users
{
    public class User : IdentityUser<int>
    {
        /// <summary>
        /// Navigation property for the roles this user belongs to.
        /// </summary>
        public virtual ICollection<UserRole> UserRoles { get; } = new List<UserRole>();
    }
}
