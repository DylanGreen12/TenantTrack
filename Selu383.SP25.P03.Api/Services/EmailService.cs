using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Services
{
    public interface IEmailService
    {
        Task SendPasswordChangeConfirmationAsync(string toEmail, string userName);
        Task SendEmailChangeConfirmationAsync(string toEmail, string userName, string oldEmail, string newEmail);
    }

    public class EmailService : IEmailService
    {
        private readonly ISendGridClient _sendGridClient;
        private readonly string _fromEmail;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;

            // Try multiple sources for the API key
            var apiKey = configuration["SENDGRID_API_KEY"] ?? 
                        Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            
            _fromEmail = configuration["FROM_EMAIL"] ?? 
                        Environment.GetEnvironmentVariable("FROM_EMAIL") ?? 
                        "noreply@tenanttrack.com";

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("SendGrid API key not found. Email service will not send emails.");
                // Don't throw - just log warning
                _sendGridClient = null;
            }
            else
            {
                _sendGridClient = new SendGridClient(apiKey);
                _logger.LogInformation("Email service initialized successfully");
            }
        }

        public async Task SendPasswordChangeConfirmationAsync(string toEmail, string userName)
        {
            if (_sendGridClient == null)
            {
                _logger.LogWarning("Email service not configured - skipping password change confirmation");
                return;
            }

            try
            {
                var subject = "Password Changed Successfully - TenantTrack";
                var plainTextContent = $"Hello {userName},\n\nYour password has been successfully changed.";
                var htmlContent = $"<strong>Hello {userName},</strong><p>Your password has been successfully changed.</p>";

                await SendEmailAsync(toEmail, subject, plainTextContent, htmlContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password change confirmation email");
            }
        }

        public async Task SendEmailChangeConfirmationAsync(string toEmail, string userName, string oldEmail, string newEmail)
        {
            if (_sendGridClient == null)
            {
                _logger.LogWarning("Email service not configured - skipping email change confirmation");
                return;
            }

            try
            {
                var subject = "Email Address Updated - TenantTrack";
                var plainTextContent = $"Hello {userName},\n\nYour email address has been updated.";
                var htmlContent = $"<strong>Hello {userName},</strong><p>Your email address has been updated.</p>";

                await SendEmailAsync(toEmail, subject, plainTextContent, htmlContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email change confirmation");
            }
        }

        private async Task SendEmailAsync(string toEmail, string subject, string plainTextContent, string htmlContent)
        {
            var from = new EmailAddress(_fromEmail, "TenantTrack");
            var to = new EmailAddress(toEmail);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            
            var response = await _sendGridClient.SendEmailAsync(msg);
            
            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                _logger.LogWarning($"Email sending failed with status: {response.StatusCode}");
            }
        }
    }
}