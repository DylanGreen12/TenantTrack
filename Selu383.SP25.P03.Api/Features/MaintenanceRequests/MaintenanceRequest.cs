using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Features.MaintenanceRequests
{
    public class MaintenanceRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TenantId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = default!;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Open";

        [Required]
        [MaxLength(50)]
        public string Priority { get; set; } = "Low"; 

        public int? AssignedTo { get; set; }

        public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? UpdatedAt { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }

        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }
    }

    public class MaintenanceRequestEntityTypeConfiguration : IEntityTypeConfiguration<MaintenanceRequest>
    {
        public void Configure(EntityTypeBuilder<MaintenanceRequest> builder)
        {
            builder.ToTable("MaintenanceRequests");

            builder.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.Priority)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasOne(m => m.Tenant)
                .WithMany()
                .HasForeignKey(m => m.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}