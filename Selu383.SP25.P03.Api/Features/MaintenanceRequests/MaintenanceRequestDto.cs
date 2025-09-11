using System.ComponentModel.DataAnnotations;

namespace Selu383.SP25.P03.Api.Features.MaintenanceRequests
{
    public class MaintenanceRequestGetDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string Description { get; set; } = default!;
        public string Status { get; set; } = default!;
        public DateTimeOffset TimeCreated { get; set; }
        public DateTimeOffset? TimeScheduled { get; set; }
        public int CreatedByUserId { get; set; }
    }

    public class MaintenanceRequestCreateDto
    {
        [Required]
        public int PropertyId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = default!;

        public string Status { get; set; } = "Pending";
        public DateTimeOffset? TimeScheduled { get; set; }

        [Required]
        public int CreatedByUserId { get; set; }
    }

    public class MaintenanceRequestUpdateDto
    {
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = default!;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = default!;

        public DateTimeOffset? TimeScheduled { get; set; }
    }
}

