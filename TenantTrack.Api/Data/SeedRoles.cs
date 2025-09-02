using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TenantTrack.Api.Features.Users;

namespace TenantTrack.Api.Data
{
    public static class SeedRoles
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new DataContext(serviceProvider.GetRequiredService<DbContextOptions<DataContext>>()))
            {
                // Look for any roles.
                if (context.Roles.Any())
                {
                    return;   // DB has been seeded
                }
                var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();
                await roleManager.CreateAsync(new Role { Name = UserRoleNames.Admin });
                await roleManager.CreateAsync(new Role { Name = UserRoleNames.User });
                context.SaveChanges();
            }
        }
    }
}
