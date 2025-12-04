using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Selu383.SP25.P03.Api.Features.Email
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;
        private readonly string _baseUrl;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger, IConfiguration configuration)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
            
            // Get base URL from environment variables or configuration
            _baseUrl = configuration["BASE_URL"] ?? 
                       Environment.GetEnvironmentVariable("BASE_URL");
        }

        public async Task SendVerificationEmailAsync(string toEmail, string toName, string verificationToken)
        {
            var subject = "Verify Your TenantTrack Email";
            var verificationLink = $"{_baseUrl}/verify-email?token={verificationToken}";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2>Welcome to TenantTrack!</h2>
                    <p>Hi {toName},</p>
                    <p>Thank you for registering with TenantTrack. Please verify your email address by clicking the link below:</p>
                    <p><a href='{verificationLink}' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verify Email</a></p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>{verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                    <br/>
                    <p>Best regards,<br/>The TenantTrack Team</p>
                </body>
                </html>";

            await SendEmailAsync(toEmail, toName, subject, body);
        }

        public async Task SendApplicationSubmittedEmailAsync(string landlordEmail, string landlordName, string tenantName, string unitNumber)
        {
            var subject = "New Rental Application Received";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2>New Rental Application</h2>
                    <p>Hi {landlordName},</p>
                    <p>You have received a new rental application:</p>
                    <ul>
                        <li><strong>Applicant:</strong> {tenantName}</li>
                        <li><strong>Unit:</strong> {unitNumber}</li>
                    </ul>
                    <p>Please log in to your TenantTrack dashboard to review and approve or deny this application.</p>
                    <p><a href='{_baseUrl}/applications' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Review Application</a></p>
                    <br/>
                    <p>Best regards,<br/>The TenantTrack Team</p>
                </body>
                </html>";

            await SendEmailAsync(landlordEmail, landlordName, subject, body);
        }

        public async Task SendApplicationApprovedEmailAsync(string tenantEmail, string tenantName, string unitNumber, string propertyName)
        {
            var subject = "Your Rental Application Has Been Approved!";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2>Congratulations!</h2>
                    <p>Hi {tenantName},</p>
                    <p>Great news! Your rental application has been approved:</p>
                    <ul>
                        <li><strong>Property:</strong> {propertyName}</li>
                        <li><strong>Unit:</strong> {unitNumber}</li>
                    </ul>
                    <p>Your lease has been created and is ready for review. Please log in to your TenantTrack account to view the details.</p>
                    <p><a href='{_baseUrl}/leases' style='background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>View Lease</a></p>
                    <br/>
                    <p>Welcome to your new home!</p>
                    <p>Best regards,<br/>The TenantTrack Team</p>
                </body>
                </html>";

            await SendEmailAsync(tenantEmail, tenantName, subject, body);
        }

        public async Task SendApplicationDeniedEmailAsync(string tenantEmail, string tenantName, string unitNumber, string propertyName, string? reason)
        {
            var subject = "Update on Your Rental Application";

            var reasonText = !string.IsNullOrEmpty(reason)
                ? $"<p><strong>Reason:</strong> {reason}</p>"
                : "";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2>Application Status Update</h2>
                    <p>Hi {tenantName},</p>
                    <p>Thank you for your interest in:</p>
                    <ul>
                        <li><strong>Property:</strong> {propertyName}</li>
                        <li><strong>Unit:</strong> {unitNumber}</li>
                    </ul>
                    <p>Unfortunately, we are unable to approve your application at this time.</p>
                    {reasonText}
                    <p>We encourage you to apply for other available properties on TenantTrack.</p>
                    <p><a href='{_baseUrl}/properties' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>View Available Properties</a></p>
                    <br/>
                    <p>Best regards,<br/>The TenantTrack Team</p>
                </body>
                </html>";

            await SendEmailAsync(tenantEmail, tenantName, subject, body);
        }

        public async Task SendLeaseConfirmationEmailAsync(string tenantEmail, string tenantName, string landlordName, string unitNumber, DateOnly startDate, DateOnly endDate, decimal rent)
        {
            var subject = "Lease Agreement Confirmation";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2>Lease Agreement Confirmed</h2>
                    <p>Hi {tenantName},</p>
                    <p>Your lease agreement has been finalized with the following details:</p>
                    <ul>
                        <li><strong>Unit:</strong> {unitNumber}</li>
                        <li><strong>Landlord:</strong> {landlordName}</li>
                        <li><strong>Start Date:</strong> {startDate:MM/dd/yyyy}</li>
                        <li><strong>End Date:</strong> {endDate:MM/dd/yyyy}</li>
                        <li><strong>Monthly Rent:</strong> ${rent:N2}</li>
                    </ul>
                    <p>Please log in to your TenantTrack account to view the complete lease agreement and make payments.</p>
                    <p><a href='{_baseUrl}/' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Go to Dashboard</a></p>
                    <br/>
                    <p>Best regards,<br/>The TenantTrack Team</p>
                </body>
                </html>";

            await SendEmailAsync(tenantEmail, tenantName, subject, body);
        }

        public async Task SendEmailChangeVerificationAsync(string toEmail, string userName, string token, string newEmail)
        {
            var verificationLink = $"{_baseUrl}/verify-email-change?token={token}&newEmail={Uri.EscapeDataString(newEmail)}";
            
            var subject = "Verify Your Email Change - TenantTrack";
            
            var body = $@"
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

            await SendEmailAsync(toEmail, userName, subject, body);
            _logger.LogInformation($"Email change verification sent to {toEmail}");
        }

        public async Task SendPasswordChangeVerificationAsync(string toEmail, string userName, string token)
        {
            var verificationLink = $"{_baseUrl}/verify-password-change?token={token}";
            
            var subject = "Verify Your Password Change - TenantTrack";
            
            var body = $@"
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

            await SendEmailAsync(toEmail, userName, subject, body);
            _logger.LogInformation($"Password change verification sent to {toEmail}");
        }

        private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                
                var senderEmail = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? _emailSettings.SenderEmail;
                var senderName = Environment.GetEnvironmentVariable("FROM_NAME") ?? _emailSettings.SenderName;
                
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                
                // Check if we're in development and should skip certificate validation
                var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
                var skipCertValidation = Environment.GetEnvironmentVariable("SMTP_SKIP_CERT_VALIDATION") == "true";
                
                if (isDevelopment || skipCertValidation)
                {
                    client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                    _logger.LogWarning("SSL certificate validation is disabled - for development use only");
                }

                var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? _emailSettings.SmtpHost;
                var smtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? _emailSettings.SmtpPort.ToString());
                var username = Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? _emailSettings.Username;
                var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? _emailSettings.Password;

                var secureSocketOptions = smtpPort == 465
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTls;

                await client.ConnectAsync(smtpHost, smtpPort, secureSocketOptions);
                await client.AuthenticateAsync(username, password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"Email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail}");
                throw;
            }
        }
    }
}