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

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendVerificationEmailAsync(string toEmail, string toName, string verificationToken)
        {
            var subject = "Verify Your TenantTrack Email";
            var verificationLink = $"http://localhost:5249/verify-email?token={verificationToken}";

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
                    <p><a href='http://localhost:5249/applications' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Review Application</a></p>
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
                    <p><a href='http://localhost:5249/leases' style='background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>View Lease</a></p>
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
                    <p><a href='http://localhost:5249/properties' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>View Available Properties</a></p>
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
                    <p><a href='http://localhost:5249/leases' style='background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>View Lease Details</a></p>
                    <br/>
                    <p>Best regards,<br/>The TenantTrack Team</p>
                </body>
                </html>";

            await SendEmailAsync(tenantEmail, tenantName, subject, body);
        }

        private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                message.To.Add(new MailboxAddress(toName, toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = htmlBody
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                // Use StartTls for port 587 (standard for Gmail/most SMTP)
                var secureSocketOptions = _emailSettings.SmtpPort == 465
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTls;

                await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, secureSocketOptions);
                await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
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
