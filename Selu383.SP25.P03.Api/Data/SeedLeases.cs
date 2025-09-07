/*
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Features.Leases;

namespace Selu383.SP25.P03.Api.Data
{
    public static class SeedLeases
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new DataContext(serviceProvider.GetRequiredService<DbContextOptions<DataContext>>()))
            {
                // Look for any leases.
                if (context.Leases.Any())
                {
                    return;   // DB has been seeded
                }
                context.Leases.AddRange(
                    new Lease
                    {
                        TenantId = 1,
                        StartDate = new DateOnly(2025, 5, 5),
                        EndDate = new DateOnly(2026, 5, 5),
                        Rent = 950,
                        Deposit = 700,
                        Status = "Active" 
                    },

                    new Lease
                    {
                        TenantId = 2,
                        StartDate = new DateOnly(2025, 6, 12),
                        EndDate = new DateOnly(2025, 12, 12),
                        Rent = 1000,
                        Deposit = 730,
                        Status = "Active" 
                    },

                    new Lease
                    {
                        TenantId = 3,
                        StartDate = new DateOnly(2025, 4, 28),
                        EndDate = new DateOnly(2026, 4, 28),
                        Rent = 1200,
                        Deposit = 880,
                        Status = "Active" 
                    }
                );
                context.SaveChanges();
            }
        }
    }
}
*/

using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Features.Leases;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Data
{
    public static class SeedLeases
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var context = new DataContext(serviceProvider.GetRequiredService<DbContextOptions<DataContext>>()))
            {
                // ✅ Prevent duplicate seeding
                if (context.Leases.Any())
                {
                    return;
                }

                // ✅ Fetch tenants dynamically
                var sanele = context.Tenants.FirstOrDefault(t => t.FirstName == "Sanele" && t.LastName == "Harmon");
                var jordan = context.Tenants.FirstOrDefault(t => t.FirstName == "Jordan" && t.LastName == "Reed");
                var alicia = context.Tenants.FirstOrDefault(t => t.FirstName == "Alicia" && t.LastName == "Nguyen");

                if (sanele != null)
                {
                    context.Leases.Add(new Lease
                    {
                        TenantId = sanele.Id,
                        StartDate = new DateOnly(2025, 5, 5),
                        EndDate = new DateOnly(2026, 5, 5),
                        Rent = 950,
                        Deposit = 700,
                        Status = "Active"
                    });
                }

                if (jordan != null)
                {
                    context.Leases.Add(new Lease
                    {
                        TenantId = jordan.Id,
                        StartDate = new DateOnly(2025, 6, 12),
                        EndDate = new DateOnly(2025, 12, 12),
                        Rent = 1000,
                        Deposit = 730,
                        Status = "Active"
                    });
                }

                if (alicia != null)
                {
                    context.Leases.Add(new Lease
                    {
                        TenantId = alicia.Id,
                        StartDate = new DateOnly(2025, 4, 28),
                        EndDate = new DateOnly(2026, 4, 28),
                        Rent = 1200,
                        Deposit = 880,
                        Status = "Active"
                    });
                }

                context.SaveChanges();
            }
        }
    }
}