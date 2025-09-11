using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace Selu383.SP25.P03.Api.Features.Payments
{
    public class PaymentGetDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public DateOnly PaymentDate { get; set; }
        public string Status { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string BillingAddressStreet { get; set; } = default!;
        public string BillingAddressCity { get; set; } = default!;
        public string BillingAddressCountry { get; set; } = default!;
    }

    public class PaymentCreateDto : IValidatableObject
    {
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        public DateOnly PaymentDate { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Name cannot be longer than 100 characters.")]
        public string Name { get; set; } = default!;

        [Required]
        [RegularExpression(@"^\d{13,19}$", ErrorMessage = "Card number must be 13–19 digits.")]
        public string CardNumber { get; set; } = default!;

        [Required]
        public string ExpirationDate { get; set; } = default!;

        [Required]
        [RegularExpression(@"^\d{3,4}$", ErrorMessage = "Security code must be 3 or 4 digits.")]
        public string SecurityCode { get; set; } = default!;

        [Required]
        public string BillingAddressStreet { get; set; } = default!;

        [Required]
        public string BillingAddressCity { get; set; } = default!;

        [Required]
        public string BillingAddressCountry { get; set; } = default!;

        [Required]
        public int UserId { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (!DateTime.TryParseExact(
                    ExpirationDate,
                    "MM/yy",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var parsedDate))
            {
                yield return new ValidationResult(
                    "Expiration date must be in MM/YY format.",
                    new[] { nameof(ExpirationDate) });
            }
            else
            {
                var lastDayOfMonth = new DateTime(parsedDate.Year, parsedDate.Month, 1)
                                        .AddMonths(1).AddDays(-1);

                if (lastDayOfMonth < DateTime.UtcNow.Date)
                {
                    yield return new ValidationResult(
                        "Expiration date must be in the future.",
                        new[] { nameof(ExpirationDate) });
                }
            }
        }
    }

    public class PaymentUpdateDto
    {
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        public DateOnly PaymentDate { get; set; }

        [Required]
        [StringLength(20, ErrorMessage = "Status cannot be longer than 20 characters.")]
        public string Status { get; set; } = default!;
    }
}
