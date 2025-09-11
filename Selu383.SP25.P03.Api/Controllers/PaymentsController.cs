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
                    PaymentDate = p.PaymentDate,
                    Status = p.Status,
                    Name = p.Name,
                    BillingAddressStreet = p.BillingAddressStreet,
                    BillingAddressCity = p.BillingAddressCity,
                    BillingAddressCountry = p.BillingAddressCountry
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
                    PaymentDate = p.PaymentDate,
                    Status = p.Status,
                    Name = p.Name,
                    BillingAddressStreet = p.BillingAddressStreet,
                    BillingAddressCity = p.BillingAddressCity,
                    BillingAddressCountry = p.BillingAddressCountry
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
        public async Task<ActionResult<PaymentGetDto>> CreatePayment(PaymentCreateDto dto)
        {
            var payment = new Payment
            {
                Amount = dto.Amount,
                PaymentDate = dto.PaymentDate,
                Name = dto.Name,
                CardNumber = dto.CardNumber,
                ExpirationDate = dto.ExpirationDate,
                SecurityCode = dto.SecurityCode,
                BillingAddressStreet = dto.BillingAddressStreet,
                BillingAddressCity = dto.BillingAddressCity,
                BillingAddressCountry = dto.BillingAddressCountry,
                UserId = dto.UserId,
                Status = "Pending"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            var resultDto = new PaymentGetDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Status = payment.Status,
                Name = payment.Name,
                BillingAddressStreet = payment.BillingAddressStreet,
                BillingAddressCity = payment.BillingAddressCity,
                BillingAddressCountry = payment.BillingAddressCountry
            };

            return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, resultDto);
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
            payment.PaymentDate = dto.PaymentDate;
            payment.Status = dto.Status;

            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();

            var resultDto = new PaymentGetDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Status = payment.Status,
                Name = payment.Name,
                BillingAddressStreet = payment.BillingAddressStreet,
                BillingAddressCity = payment.BillingAddressCity,
                BillingAddressCountry = payment.BillingAddressCountry
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
