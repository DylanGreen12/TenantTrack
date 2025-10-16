using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Payments;
using Microsoft.AspNetCore.Identity;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/payments")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<User> _userManager;

        public PaymentsController(DataContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
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

                    if (staffRecord != null)
                    {
                        // Filter payments to only show those for tenants in the staff's property
                        paymentsQuery = paymentsQuery.Where(p => p.Tenant.Unit.PropertyId == staffRecord.PropertyId);
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
    }
}
