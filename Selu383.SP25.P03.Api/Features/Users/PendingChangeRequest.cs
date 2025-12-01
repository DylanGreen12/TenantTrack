namespace Selu383.SP25.P03.Api.Features.Users
{
    public class PendingChangeRequest
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Token { get; set; } = string.Empty;
        public string ChangeType { get; set; } = string.Empty; // "Email" or "Password"
        public string? NewEmail { get; set; }
        public string? NewPassword { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class RequestEmailChangeDto
    {
        public string NewEmail { get; set; } = string.Empty;
    }

    public class RequestPasswordChangeDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class VerifyChangeDto
    {
        public string Token { get; set; } = string.Empty;
    }
}