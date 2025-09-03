using Microsoft.AspNetCore.Identity;

namespace TenantTrack.Api.Features.Users
{
    public class UserRole : IdentityUserRole<int>
    {
        public virtual User User { get; set; }
        public virtual Role Role { get; set; }
    }
}
