namespace Selu383.SP25.P03.Api.Features.Payments
{
    public interface IStripeService
    {
        /// <summary>
        /// Creates or retrieves a Stripe customer for a user
        /// </summary>
        Task<string> GetOrCreateCustomerAsync(int userId, string email, string? name);

        /// <summary>
        /// Creates a payment intent for a payment (lease payment or rent payment)
        /// </summary>
        Task<string> CreatePaymentIntentAsync(string customerId, decimal amount, int? leaseId = null);

        /// <summary>
        /// Confirms a payment and returns the payment status
        /// </summary>
        Task<bool> ConfirmPaymentAsync(string paymentIntentId);
    }
}
