using Stripe;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Selu383.SP25.P03.Api.Features.Payments
{
    public class StripeService : IStripeService
    {
        private readonly DataContext _context;
        private readonly ILogger<StripeService> _logger;
        private readonly IConfiguration _configuration;

        public StripeService(DataContext context, ILogger<StripeService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            
            // Try environment variable first, then fall back to configuration (user secrets)
            var stripeSecretKey = Environment.GetEnvironmentVariable("SecretKey") 
                                ?? _configuration["Stripe:SecretKey"];
            
            if (string.IsNullOrEmpty(stripeSecretKey))
            {
                throw new InvalidOperationException("Stripe SecretKey not configured. Set it as environment variable 'SecretKey' or in user secrets as 'Stripe:SecretKey'");
            }
            
            StripeConfiguration.ApiKey = stripeSecretKey;
        }

        public async Task<string> GetOrCreateCustomerAsync(int userId, string email, string? name)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found", nameof(userId));
            }

            // If user already has a Stripe customer ID, return it
            if (!string.IsNullOrEmpty(user.StripeCustomerId))
            {
                return user.StripeCustomerId;
            }

            // Create a new Stripe customer
            var options = new CustomerCreateOptions
            {
                Email = email,
                Name = name ?? email,
                Metadata = new Dictionary<string, string>
                {
                    { "UserId", userId.ToString() }
                }
            };

            var service = new CustomerService();
            var customer = await service.CreateAsync(options);

            // Save the customer ID to the user record
            user.StripeCustomerId = customer.Id;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Created Stripe customer {customer.Id} for user {userId}");

            return customer.Id;
        }

        public async Task<string> CreatePaymentIntentAsync(string customerId, decimal amount, int? leaseId = null)
        {
            var metadata = new Dictionary<string, string>();
            if (leaseId.HasValue)
            {
                metadata.Add("LeaseId", leaseId.Value.ToString());
            }

            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100), // Stripe uses cents
                Currency = "usd",
                Customer = customerId,
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
                Metadata = metadata
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            var logMessage = leaseId.HasValue
                ? $"Created payment intent {paymentIntent.Id} for lease {leaseId.Value}, amount: ${amount}"
                : $"Created payment intent {paymentIntent.Id} for rent payment, amount: ${amount}";
            _logger.LogInformation(logMessage);

            return paymentIntent.ClientSecret;
        }

        public async Task<bool> ConfirmPaymentAsync(string paymentIntentId)
        {
            try
            {
                var service = new PaymentIntentService();
                var paymentIntent = await service.GetAsync(paymentIntentId);

                if (paymentIntent.Status == "succeeded")
                {
                    _logger.LogInformation($"Payment {paymentIntentId} succeeded");
                    return true;
                }

                _logger.LogWarning($"Payment {paymentIntentId} has status: {paymentIntent.Status}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error confirming payment {paymentIntentId}");
                return false;
            }
        }
    }
}