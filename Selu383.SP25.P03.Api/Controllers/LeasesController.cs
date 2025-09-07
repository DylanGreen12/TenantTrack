using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Leases;
using Selu383.SP25.P03.Api.Features.Tenants;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/leases")]
    [ApiController]
    public class LeasesController : ControllerBase
    {
        private readonly DataContext _context;

        public LeasesController(DataContext context)
        {
            _context = context;
        }

        // GET: api/leases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaseDto>>> GetLeases()
        {
            var leases = await _context.Leases
                .Select(l => new LeaseDto
                {
                    Id = l.Id,
                    TenantId = l.TenantId,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Rent = l.Rent,
                    Deposit = l.Deposit,
                    Status = l.Status 
                })
                .ToListAsync();

            return Ok(leases);
        }

        // GET: api/leases/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LeaseDto>> GetLeaseById(int id)
        {
            var lease = await _context.Leases
                .Where(l => l.Id == id)
                .Select(l => new LeaseDto
                {
                    Id = l.Id,
                    TenantId = l.TenantId,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Rent = l.Rent,
                    Deposit = l.Deposit,
                    Status = l.Status  
                })
                .FirstOrDefaultAsync();

            if (lease == null)
            {
                return NotFound();
            }

            return Ok(lease);
        }

        // POST: api/leases
        [HttpPost]
        public async Task<ActionResult<LeaseDto>> CreateLease(LeaseDto dto)
        {
            
            var tenant = await _context.Tenants.FindAsync(dto.TenantId);
            if (tenant == null)
            {
                return NotFound("Tenant not found");
            }
            
            var lease = new Lease
            {
                TenantId = dto.TenantId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Rent = dto.Rent,
                Deposit = dto.Deposit,
                Status = dto.Status 
            };

            _context.Leases.Add(lease);
            await _context.SaveChangesAsync();

            dto.Id = lease.Id;
            return CreatedAtAction(nameof(GetLeaseById), new { id = dto.Id }, dto);
        }

        // PUT: api/leases/5
        [HttpPut("{id}")]
        public async Task<ActionResult<LeaseDto>> UpdateLease(int id, LeaseDto dto)
        {
            var lease = await _context.Leases.FindAsync(id);
            if (lease == null)
            {
                return NotFound();
            }

            lease.TenantId = dto.TenantId;
            lease.StartDate = dto.StartDate;
            lease.EndDate = dto.EndDate;
            lease.Rent = dto.Rent;
            lease.Deposit = dto.Deposit;
            lease.Status = dto.Status;
             

            _context.Leases.Update(lease);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        // DELETE: api/leases/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLease(int id)
        {
            var lease = await _context.Leases.FindAsync(id);
            if (lease == null)
            {
                return NotFound();
            }

            _context.Leases.Remove(lease);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}