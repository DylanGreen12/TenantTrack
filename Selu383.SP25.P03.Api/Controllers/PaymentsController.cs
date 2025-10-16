using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Payments;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/payments")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly DataContext _context;

        public PaymentsController(DataContext context)
        {
            _context = context;
        }

        // GET: api/payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentGetDto>>> GetPayments()
        {
            var payments = await _context.Payments
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
