using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Data
{
    public static class SeedRoles
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new DataContext(
                serviceProvider.GetRequiredService<DbContextOptions<DataContext>>()))
            {
                var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();

                var rolesToSeed = new[]
                {
                    UserRoleNames.Admin,    
                    UserRoleNames.User,     
                    UserRoleNames.Tenant, 
                    UserRoleNames.Landlord,
                    UserRoleNames.Maintenance
                };

                foreach (var roleName in rolesToSeed)
                {
                    // Skip if role already exists
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new Role { Name = roleName });
                        Console.WriteLine($"Created role: {roleName}");
                    }
                }

                // Optional: Ensure no old/typo roles linger
                var allRoles = await roleManager.Roles.ToListAsync();
                foreach (var role in allRoles)
                {
                    if (!rolesToSeed.Contains(role.Name))
                    {
                        Console.WriteLine($"Warning: Orphaned role detected: {role.Name}");
                        // await roleManager.DeleteAsync(role); // Uncomment to auto-clean
                    }
                }
            }
        }
    }
}