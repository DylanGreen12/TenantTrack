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
        public DateOnly PaymentDate { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = default!;

        [Required]
        [CreditCard]
        public string CardNumber { get; set; } = default!;

        [Required]
        public string ExpirationDate { get; set; } = default!;

        [Required]
        [StringLength(4, MinimumLength = 3)]
        public string SecurityCode { get; set; } = default!;

        [Required]
        public string BillingAddressStreet { get; set; } = default!;

        [Required]
        public string BillingAddressCity { get; set; } = default!;

        [Required]
        public string BillingAddressCountry { get; set; } = default!;

        [Required]
        public int UserId { get; set; }
        public virtual User User { get; set; } = default!;
    }
}
