using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Features.Leases
{
    public class Lease
    {
        [Key]
        public int Id { get; set; }

        public required int TenantId { get; set; }

        [ForeignKey("TenantId")]
        public required DateOnly StartDate { get; set; }

        public required DateOnly EndDate { get; set; }
        
        public required decimal Rent { get; set; }

        public required decimal Deposit { get; set; }

        
        public required string Status { get; set; } 
        
        public virtual Tenant Tenant { get; set; } 
    }
}