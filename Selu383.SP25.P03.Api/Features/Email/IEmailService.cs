namespace Selu383.SP25.P03.Api.Features.Email
{
    public interface IEmailService
    {
        Task SendVerificationEmailAsync(string toEmail, string toName, string verificationToken);
        Task SendApplicationSubmittedEmailAsync(string landlordEmail, string landlordName, string tenantName, string unitNumber);
        Task SendApplicationApprovedEmailAsync(string tenantEmail, string tenantName, string unitNumber, string propertyName);
        Task SendApplicationDeniedEmailAsync(string tenantEmail, string tenantName, string unitNumber, string propertyName, string? reason);
        Task SendLeaseConfirmationEmailAsync(string tenantEmail, string tenantName, string landlordName, string unitNumber, DateOnly startDate, DateOnly endDate, decimal rent);
        Task SendEmailChangeVerificationAsync(string toEmail, string userName, string token, string newEmail);
        Task SendPasswordChangeVerificationAsync(string toEmail, string userName, string token);
    }
}
