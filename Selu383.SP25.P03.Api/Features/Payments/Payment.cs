using System.ComponentModel.DataAnnotations;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Features.Payments
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        public DateOnly Date { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentMethod { get; set; } = "Card"; // e.g. Card, Bank Transfer

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Paid, Pending, Failed

        // Foreign key
        [Required]
        public int TenantId { get; set; }
        public virtual User Tenant { get; set; } = default!;
    }
}

