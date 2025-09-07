using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Features.Leases
{
    public class Lease
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public int TenantId { get; set; }

        [ForeignKey("TenantId")]
        [Required]
        [MaxLength(120)]
        public date StartDate { get; set; }

        [Required]
        public date EndDate { get; set; }

        [Required]
        public decimal Rent { get; set; }

        [Required]
        public decimal Deposit { get; set; }

        [Required]
        public string Status { get; set; } 
        
        public virtual Tenant Tenant { get; set; } 
    }
}