using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TenantTrack.Api.Features.Users;
using TenantTrack.Api.Features.Properties;

namespace TenantTrack.Api.Data
{
    public class DataContext : IdentityDbContext<User, Role, int, IdentityUserClaim<int>, UserRole, IdentityUserLogin<int>, IdentityRoleClaim<int>, IdentityUserToken<int>>
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {
        }

       public DbSet<Property> Properties { get; set; }

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
        }
    }
}
