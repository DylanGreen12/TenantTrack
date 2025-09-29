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

 // Card info only used here for processing, NOT stored in DB
        [CreditCard]
        public string? CardNumber { get; set; }

        [RegularExpression(@"^(0[1-9]|1[0-2])\/?([0-9]{2})$", ErrorMessage = "Expiration must be MM/YY")]
        public string? ExpirationDate { get; set; }

        [StringLength(4, MinimumLength = 3)]
        public string? SecurityCode { get; set; }

        public int TenantId { get; set; }
    }

    public class PaymentUpdateDto
    {
        public decimal Amount { get; set; }
        public DateOnly Date { get; set; }
        public string Status { get; set; } = default!;
        public string PaymentMethod { get; set; } = default!;
    }
}
