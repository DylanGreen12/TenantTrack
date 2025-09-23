using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Features.Users;
using Selu383.SP25.P03.Api.Features.Theaters;
using Selu383.SP25.P03.Api.Features.Properties;
using Selu383.SP25.P03.Api.Features.Units;
using Selu383.SP25.P03.Api.Features.Tenants;
using Selu383.SP25.P03.Api.Features.Leases;
using Selu383.SP25.P03.Api.Features.Payments;
using Selu383.SP25.P03.Api.Features.MaintenanceRequests;

namespace Selu383.SP25.P03.Api.Data
{
    public class DataContext : IdentityDbContext<User, Role, int, IdentityUserClaim<int>, UserRole, IdentityUserLogin<int>, IdentityRoleClaim<int>, IdentityUserToken<int>>
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {
        }

        public DbSet<Theater> Theaters { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<Lease> Leases { get; set; }
        public DbSet<Tenant> Tenants { get; set; }

        public DbSet<Payment> Payments { get; set; }
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; } = default!;


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<UserRole>().HasKey(x => new { x.UserId, x.RoleId });

            builder.Entity<User>()
                .HasMany(e => e.UserRoles)
                .WithOne(x => x.User)
                .HasForeignKey(e => e.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Role>()
                .HasMany(e => e.UserRoles)
                .WithOne(x => x.Role)
                .HasForeignKey(e => e.RoleId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Unit>()
                .HasOne(u => u.Property)
                .WithMany()
                .HasForeignKey(u => u.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.ApplyConfiguration(new MaintenanceRequestEntityTypeConfiguration());    
        }
    }
}
