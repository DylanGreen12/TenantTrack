using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Payments;
using Microsoft.AspNetCore.Identity;
using Selu383.SP25.P03.Api.Features.Users;
using Selu383.SP25.P03.Api.Features.Leases;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/payments")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IStripeService _stripeService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(DataContext context, UserManager<User> userManager, IStripeService stripeService, ILogger<PaymentsController> logger)
        {
            _context = context;
            _userManager = userManager;
            _stripeService = stripeService;
            _logger = logger;
        }

        // GET: api/payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentGetDto>>> GetPayments()
        {
            var user = await _userManager.GetUserAsync(User);

            // Get all payments initially
            var paymentsQuery = _context.Payments
                .Include(p => p.Tenant)
                    .ThenInclude(t => t.Unit)
                    .ThenInclude(u => u.Property)
                .AsQueryable();

            // If user is logged in, filter based on role
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);

                // Landlords only see payments for tenants in their properties
                if (roles.Contains(UserRoleNames.Landlord))
                {
                    paymentsQuery = paymentsQuery.Where(p => p.Tenant.Unit.Property.UserId == user.Id);
                }

                // Staff (Maintenance) only see payments for their assigned property
                if (roles.Contains(UserRoleNames.Maintenance))
                {
                    // Find the staff record by email (matches Staff.Email to User.Email)
                    var staffRecord = await _context.Staff
                        .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

                    if (staffRecord != null && staffRecord.PropertyId > 0)
                    {
                        // Filter payments to only show those for tenants in the staff's property
                        paymentsQuery = paymentsQuery.Where(p => p.Tenant.Unit.PropertyId == staffRecord.PropertyId);
                    }
                    else
                    {
                        // Staff not assigned to a property - return empty results
                        paymentsQuery = paymentsQuery.Where(p => false);
                    }
                }

                // Tenants only see their own payments
                if (roles.Contains(UserRoleNames.Tenant))
                {
                    paymentsQuery = paymentsQuery.Where(p => p.Tenant.Email.ToLower() == user.Email.ToLower());
                }
            }

            var payments = await paymentsQuery
                .Select(p => new PaymentGetDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    Date = p.Date,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    TenantId = p.TenantId
                })
                .ToListAsync();

            return Ok(payments);
}


        // GET: api/payments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentGetDto>> GetPaymentById(int id)
        {
            var payment = await _context.Payments
                .Where(p => p.Id == id)
                .Select(p => new PaymentGetDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    Date = p.Date,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    TenantId = p.TenantId
                })
                .FirstOrDefaultAsync();

            if (payment == null)
            {
                return NotFound();
            }

            return Ok(payment);
        }

        // POST: api/payments
        [HttpPost]
        public async Task<ActionResult<Payment>> CreatePayment(PaymentCreateDto dto)
        {
            // Validate that the tenant exists
            var tenantExists = await _context.Tenants.AnyAsync(t => t.Id == dto.TenantId);
            if (!tenantExists)
            {
                return BadRequest(new { message = $"Tenant with ID {dto.TenantId} does not exist" });
            }

            // Map only DB fields
            var payment = new Payment
            {
                Amount = dto.Amount,
                Date = dto.Date,
                PaymentMethod = dto.PaymentMethod,
                Status = dto.Status,
                TenantId = dto.TenantId
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // TODO: use dto.CardNumber, dto.ExpirationDate, etc. for future payment gateway
            // but do NOT save them to the database.

            return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, payment);
        }


        // PUT: api/payments/5
        [HttpPut("{id}")]
        public async Task<ActionResult<PaymentGetDto>> UpdatePayment(int id, PaymentUpdateDto dto)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            payment.Amount = dto.Amount;
            payment.Date = dto.Date;
            payment.Status = dto.Status;
            payment.PaymentMethod = dto.PaymentMethod;

            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();

            var resultDto = new PaymentGetDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                Date = payment.Date,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                TenantId = payment.TenantId
            };

            return Ok(resultDto);
        }

        // DELETE: api/payments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/payments/lease/{leaseId}/create-intent
        [HttpPost("lease/{leaseId}/create-intent")]
        public async Task<ActionResult> CreateLeasePaymentIntent(int leaseId)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            // Get the lease with tenant information
            var lease = await _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.Unit)
                        .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(l => l.Id == leaseId);

            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            // Verify the user is the tenant for this lease
            if (lease.Tenant.Email.ToLower() != user.Email.ToLower())
            {
                return Forbid();
            }

            // Verify the lease is in Approved-AwaitingPayment status
            if (lease.Status != "Approved-AwaitingPayment")
            {
                return BadRequest(new { message = "This lease is not awaiting payment" });
            }

            try
            {
                // Calculate total amount (first month rent + deposit)
                var totalAmount = lease.Rent + lease.Deposit;

                // Get or create Stripe customer for the user
                var userName = user.UserName ?? user.Email;
                var customerId = await _stripeService.GetOrCreateCustomerAsync(user.Id, user.Email!, userName);

                // Create payment intent
                var clientSecret = await _stripeService.CreatePaymentIntentAsync(customerId, totalAmount, leaseId);

                _logger.LogInformation($"Created payment intent for lease {leaseId}, amount: ${totalAmount}");

                return Ok(new
                {
                    clientSecret,
                    amount = totalAmount,
                    leaseId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating payment intent for lease {leaseId}");
                return StatusCode(500, new { message = "Failed to create payment intent" });
            }
        }

        // POST: api/payments/rent/create-intent
        [HttpPost("rent/create-intent")]
        public async Task<ActionResult> CreateRentPaymentIntent([FromBody] CreateRentPaymentRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            // Verify the user is a tenant
            var tenant = await _context.Tenants
                .Include(t => t.Unit)
                    .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(t => t.Email.ToLower() == user.Email.ToLower());

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant account not found" });
            }

            // Get the tenant's active lease
            var lease = await _context.Leases
                .FirstOrDefaultAsync(l => l.TenantId == tenant.Id && 
                (l.Status == "Active" || l.Status == "Approved-AwaitingPayment"));

            if (lease == null)
            {
                return BadRequest(new { message = "active lease found" });
            }

            try
            {
                // Get or create Stripe customer for the user
                var userName = user.UserName ?? user.Email;
                var customerId = await _stripeService.GetOrCreateCustomerAsync(user.Id, user.Email!, userName);

                // Create payment intent for the requested amount
                var clientSecret = await _stripeService.CreatePaymentIntentAsync(customerId, request.Amount, null);

                _logger.LogInformation($"Created rent payment intent for tenant {tenant.Id}, amount: ${request.Amount}");

                return Ok(new
                {
                    clientSecret,
                    amount = request.Amount,
                    tenantId = tenant.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating rent payment intent for tenant {tenant.Id}");
                return StatusCode(500, new { message = "Failed to create payment intent" });
            }
        }

        // POST: api/payments/rent/confirm
        [HttpPost("rent/confirm")]
        public async Task<ActionResult> ConfirmRentPayment([FromBody] ConfirmRentPaymentRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            // Verify the user is a tenant
            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.Email.ToLower() == user.Email.ToLower());

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant account not found" });
            }

            // Get the tenant's active lease
            var lease = await _context.Leases
                .FirstOrDefaultAsync(l => l.TenantId == tenant.Id && 
                (l.Status == "Active" || l.Status == "Approved-AwaitingPayment"));

            if (lease == null)
            {
                return BadRequest(new { message = "No active lease found" });
            }

            try
            {
                // Confirm the payment with Stripe
                var paymentSucceeded = await _stripeService.ConfirmPaymentAsync(request.PaymentIntentId);

                if (!paymentSucceeded)
                {
                    return BadRequest(new { message = "Payment confirmation failed" });
                }

                // Create payment record
                var payment = new Payment
                {
                    TenantId = tenant.Id,
                    LeaseId = lease.Id,
                    Amount = request.Amount,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    PaymentMethod = "Card",
                    Status = "Paid",
                    StripePaymentIntentId = request.PaymentIntentId
                };

                _context.Payments.Add(payment);
                if (lease.Status == "Approved-AwaitingPayment")
                    {
                        lease.Status = "Active";
                        _context.Leases.Update(lease);

                        // Mark unit as Rented
                        var unit = await _context.Units.FirstOrDefaultAsync(u => u.Id == tenant.UnitId);
                        if (unit != null)
                        {
                            unit.Status = "Rented";
                            _context.Units.Update(unit);
                        }
                    }
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Rent payment confirmed for tenant {tenant.Id}, payment intent: {request.PaymentIntentId}");

                return Ok(new { message = "Payment confirmed successfully", paymentId = payment.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error confirming rent payment for tenant {tenant.Id}");
                return StatusCode(500, new { message = "Failed to confirm payment" });
            }
        }

        // POST: api/payments/lease/{leaseId}/confirm
        [HttpPost("lease/{leaseId}/confirm")]
        public async Task<ActionResult> ConfirmLeasePayment(int leaseId, [FromBody] ConfirmPaymentRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var lease = await _context.Leases
                .Include(l => l.Tenant)
                .FirstOrDefaultAsync(l => l.Id == leaseId);

            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            // Verify the user is the tenant for this lease
            if (lease.Tenant.Email.ToLower() != user.Email.ToLower())
            {
                return Forbid();
            }

            try
            {
                // Confirm the payment with Stripe
                var paymentSucceeded = await _stripeService.ConfirmPaymentAsync(request.PaymentIntentId);

                if (!paymentSucceeded)
                {
                    return BadRequest(new { message = "Payment confirmation failed" });
                }

                // Create payment record
                var payment = new Payment
                {
                    TenantId = lease.TenantId,
                    LeaseId = leaseId,
                    Amount = lease.Rent + lease.Deposit,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    PaymentMethod = "Card",
                    Status = "Paid",
                    StripePaymentIntentId = request.PaymentIntentId
                };

                _context.Payments.Add(payment);

                // Update lease status to Active
                lease.Status = "Active";
                _context.Leases.Update(lease);

                // Mark unit as Rented now that lease is active
                var unit = await _context.Units.FindAsync(lease.Tenant.UnitId);
                if (unit != null)
                {
                    unit.Status = "Rented";
                    _context.Units.Update(unit);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment confirmed for lease {leaseId}, payment intent: {request.PaymentIntentId}");

                return Ok(new { message = "Payment confirmed successfully", leaseId, paymentId = payment.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error confirming payment for lease {leaseId}");
                return StatusCode(500, new { message = "Failed to confirm payment" });
            }
        }
    }

    public class ConfirmPaymentRequest
    {
        public string PaymentIntentId { get; set; } = string.Empty;
    }

    public class CreateRentPaymentRequest
    {
        public decimal Amount { get; set; }
    }

    public class ConfirmRentPaymentRequest
    {
        public string PaymentIntentId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
