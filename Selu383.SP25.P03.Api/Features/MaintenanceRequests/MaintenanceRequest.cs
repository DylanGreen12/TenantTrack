using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.ComponentModel.DataAnnotations;

namespace Selu383.SP25.P03.Api.Features.MaintenanceRequests
{
    public class MaintenanceRequest
    {
        public int Id { get; set; }

        [Required]
        public int PropertyId { get; set; } 

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = default!;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public DateTimeOffset TimeCreated { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? TimeScheduled { get; set; }

        [Required]
        public int CreatedByUserId { get; set; }
    }

    public class MaintenanceRequestEntityTypeConfiguration : IEntityTypeConfiguration<MaintenanceRequest>
    {
        public void Configure(EntityTypeBuilder<MaintenanceRequest> builder)
        {
            builder.ToTable("MaintenanceRequests");
        }
    }
}
