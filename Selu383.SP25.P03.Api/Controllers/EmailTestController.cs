using Microsoft.AspNetCore.Mvc;
using Selu383.SP25.P03.Api.Features.Email;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/email-test")]
    [ApiController]
    public class EmailTestController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailTestController> _logger;

        public EmailTestController(IEmailService emailService, ILogger<EmailTestController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        // Test endpoint: GET /api/email-test/send?email=your@email.com
        [HttpGet("send")]
        public async Task<ActionResult> SendTestEmail([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Email parameter is required" });
            }

            try
            {
                _logger.LogInformation($"Attempting to send test email to {email}");

                await _emailService.SendVerificationEmailAsync(
                    email,
                    "Test User",
                    "test-token-12345"
                );

                return Ok(new {
                    message = $"Test verification email sent successfully to {email}",
                    note = "Check your inbox (and spam folder)"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send test email to {email}");
                return StatusCode(500, new {
                    error = "Failed to send email",
                    details = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }
    }
}
