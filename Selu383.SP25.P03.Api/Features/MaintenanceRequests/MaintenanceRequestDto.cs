using System.ComponentModel.DataAnnotations;

namespace Selu383.SP25.P03.Api.Features.MaintenanceRequests
{
    public class MaintenanceRequestDto
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string Description { get; set; } = default!;
        public string Status { get; set; } = default!;
        public string Priority { get; set; } = default!;
        public int? AssignedTo { get; set; }
        public DateTimeOffset RequestedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }
    }
}    