using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailChangeVerificationAsync(string toEmail, string userName, string token, string newEmail);
        Task SendPasswordChangeVerificationAsync(string toEmail, string userName, string token);
    }

    public class EmailService : IEmailService
    {
        private readonly ISendGridClient _sendGridClient;
        private readonly string _fromEmail;
        private readonly ILogger<EmailService> _logger;
        private readonly string _baseUrl;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;

            // Try multiple sources for the API key
            var apiKey = configuration["SENDGRID_API_KEY"] ?? 
                        Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            
            _fromEmail = configuration["FROM_EMAIL"] ?? 
                        Environment.GetEnvironmentVariable("FROM_EMAIL");

            // base URL for verification links 
            _baseUrl = configuration["BASE_URL"] ??
                        Environment.GetEnvironmentVariable("BASE_URL"); 

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("SendGrid API key not found. Email service will not send emails.");
                _sendGridClient = null;
            }
            else
            {
                _sendGridClient = new SendGridClient(apiKey);
                _logger.LogInformation("Email service initialized successfully");
            }
        }

        public async Task SendEmailChangeVerificationAsync(string toEmail, string userName, string token, string newEmail)
        {
            if (_sendGridClient == null)
            {
                _logger.LogWarning("Email service not configured - skipping email change verification");
                return;
            }

            try
            {
                var verificationLink = $"{_baseUrl}/verify-email-change?token={token}&newEmail={Uri.EscapeDataString(newEmail)}";
                
                var subject = "Verify Your Email Change - TenantTrack";
                var plainTextContent = $"Hello {userName},\n\n" +
                                     $"You requested to change your email to: {newEmail}\n\n" +
                                     $"Please click the link below to verify this change:\n{verificationLink}\n\n" +
                                     $"This link will expire in 1 hour.\n\n" +
                                     $"If you didn't request this change, please ignore this email.";

                var htmlContent = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                            <h2 style='color: #333;'>Verify Your Email Change</h2>
                            <p>Hello {userName},</p>
                            <p>You requested to change your email to: <strong>{newEmail}</strong></p>
                            <p>Please click the button below to verify this change:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>Verify Email Change</a>
                            </div>
                            <p style='color: #666; font-size: 14px;'>This link will expire in 1 hour.</p>
                            <p style='color: #666; font-size: 14px;'>If you didn't request this change, please ignore this email.</p>
                            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                            <p style='color: #999; font-size: 12px;'>TenantTrack - Property Management System</p>
                        </div>
                    </body>
                    </html>";

                await SendEmailAsync(toEmail, subject, plainTextContent, htmlContent);
                _logger.LogInformation($"Email change verification sent to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email change verification");
            }
        }

        public async Task SendPasswordChangeVerificationAsync(string toEmail, string userName, string token)
        {
            if (_sendGridClient == null)
            {
                _logger.LogWarning("Email service not configured - skipping password change verification");
                return;
            }

            try
            {
                var verificationLink = $"{_baseUrl}/verify-password-change?token={token}";
                
                var subject = "Verify Your Password Change - TenantTrack";
                var plainTextContent = $"Hello {userName},\n\n" +
                                     $"You requested to change your password.\n\n" +
                                     $"Please click the link below to verify this change:\n{verificationLink}\n\n" +
                                     $"This link will expire in 1 hour.\n\n" +
                                     $"If you didn't request this change, please contact support immediately.";

                var htmlContent = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                            <h2 style='color: #333;'>Verify Your Password Change</h2>
                            <p>Hello {userName},</p>
                            <p>You requested to change your password.</p>
                            <p>Please click the button below to verify this change:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>Verify Password Change</a>
                            </div>
                            <p style='color: #666; font-size: 14px;'>This link will expire in 1 hour.</p>
                            <p style='color: #dc3545; font-size: 14px; font-weight: bold;'>If you didn't request this change, please contact support immediately.</p>
                            <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                            <p style='color: #999; font-size: 12px;'>TenantTrack - Property Management System</p>
                        </div>
                    </body>
                    </html>";

                await SendEmailAsync(toEmail, subject, plainTextContent, htmlContent);
                _logger.LogInformation($"Password change verification sent to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password change verification");
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
            else
            {
                _logger.LogInformation($"Email sent successfully to {toEmail}");
            }
        }
    }
}