using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Data
{
    public static class SeedTenants
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new DataContext(serviceProvider.GetRequiredService<DbContextOptions<DataContext>>()))
            {
                // Look for any tenants.
                if (context.Tenants.Any())
                {
                    return;   // DB has been seeded
                }
                context.Tenants.AddRange(
                    new Tenant
                    {
                        Unit = 247,
                        FirstName = "Sanele",
                        LastName = "Harmon",
                        PhoneNumber = "504-276-8896",
                        Email = "SHarmon@gmail.com",
                        CreatedAt = new DateTime(2025, 5, 5, 13, 15, 0),
                        UpdatedAt = new DateTime(2025, 5, 5, 13, 15, 0)
                    },

                    new Tenant
                    {
                        Unit = 112,
                        FirstName = "Jordan",
                        LastName = "Reed",
                        PhoneNumber = "318-555-2311",
                        Email = "jreed@example.com",
                        CreatedAt = new DateTime(2025, 6, 12, 9, 30, 0),
                        UpdatedAt = new DateTime(2025, 7, 3, 12, 30, 0)
                    },

                    new Tenant
                    {
                        Unit = 305,
                        FirstName = "Alicia",
                        LastName = "Nguyen",
                        PhoneNumber = "225-444-7890",
                        Email = "alicia.nguyen@example.com",
                        CreatedAt = new DateTime(2025, 4, 28, 15, 45, 0),
                        UpdatedAt = new DateTime(2025, 4, 28, 15, 45, 0)
                    }
                );
                context.SaveChanges();
            }
        }
    }
}
