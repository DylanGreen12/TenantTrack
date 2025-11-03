using Microsoft.AspNetCore.Identity;

namespace Selu383.SP25.P03.Api.Features.Users
{
    public class User : IdentityUser<int>
    {
        /// <summary>
        /// Navigation property for the roles this user belongs to.
        /// </summary>
        public virtual ICollection<UserRole> UserRoles { get; } = new List<UserRole>();

        // Email is inherited from IdentityUser<int> - no need to redeclare
        // PhoneNumber is inherited from IdentityUser<int> - use Phone property as an alias
        public string? Phone
        {
            get => PhoneNumber;
            set => PhoneNumber = value;
        }
    }

}
