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

        [HttpPost]
        public async Task<ActionResult<Payment>> CreatePayment(PaymentCreateDto dto)
        {
            var tenant = await _context.Tenants.FindAsync(dto.TenantId);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            var payment = new Payment
            {
                Amount = dto.Amount,
                Date = dto.Date,
                PaymentMethod = dto.PaymentMethod,
                Status = "Pending",
                TenantId = dto.TenantId
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, payment);
        }

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