using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Features.Payments
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TenantId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        public DateOnly Date { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = "Card"; // Card, Cash, Check, Bank Transfer

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Paid, Pending, Failed

        // Navigation property
        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }
    }
}