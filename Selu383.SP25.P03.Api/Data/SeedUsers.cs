using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Data
{
    public static class SeedUsers
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new DataContext(serviceProvider.GetRequiredService<DbContextOptions<DataContext>>()))
            {
                // Look for any roles.
                if (context.Users.Any())
                {
                    return;   // DB has been seeded
                }
                var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

                var galkadi = new User { UserName = "galkadi", };
                await userManager.CreateAsync(galkadi, "Password123!");
                await userManager.AddToRoleAsync(galkadi, "Admin");

                var bob = new User { UserName = "bob", };
                await userManager.CreateAsync(bob, "Password123!");
                await userManager.AddToRoleAsync(bob, "User");

                var sue = new User { UserName = "sue", };
                await userManager.CreateAsync(sue, "Password123!");
                await userManager.AddToRoleAsync(sue, "User");

                context.SaveChanges();
            }
        }
    }
}
