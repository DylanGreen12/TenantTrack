using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace Selu383.SP25.P03.Api.Features.Payments
{
    public class PaymentGetDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
        public string PaymentMethod { get; set; } = default!;
        public string Status { get; set; } = default!;
        public int TenantId { get; set; }
        public int? LeaseId { get; set; }
        public string? StripePaymentIntentId { get; set; }
    }
    public class PaymentCreateDto
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public DateOnly Date { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentMethod { get; set; } = "Card";

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        public int TenantId { get; set; }

        public int? LeaseId { get; set; }
    }

    public class PaymentUpdateDto
    {
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
        public string Status { get; set; } = default!;
        public string PaymentMethod { get; set; } = default!;
    }
}
