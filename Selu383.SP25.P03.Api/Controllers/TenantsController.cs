using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Tenants;
//using Selu383.SP25.P03.Api.Features.Units;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/tenants")]
    [ApiController]
    public class TenantsController : ControllerBase
    {
        private readonly DataContext _context;

        public TenantsController(DataContext context)
        {
            _context = context;
        }

        // GET: api/tenants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TenantDto>>> GetTenants()
        {
            var tenants = await _context.Tenants
                .Select(t => new TenantDto
                {
                    Id = t.Id,
                    Unit = t.Unit,
                    FirstName = t.FirstName,
                    LastName = t.LastName,
                    PhoneNumber = t.PhoneNumber,
                    Email = t.Email,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tenants);
        }

        // GET: api/tenants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TenantDto>> GetTenantById(int id)
        {
            var tenant = await _context.Tenants
                .Where(t => t.Id == id)
                .Select(t => new TenantDto
                {
                    Id = t.Id,
                    Unit = t.Unit,
                    FirstName = t.FirstName,
                    LastName = t.LastName,
                    PhoneNumber = t.PhoneNumber,
                    Email = t.Email,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt 
                })
                .FirstOrDefaultAsync();

            if (tenant == null)
            {
                return NotFound();
            }

            return Ok(tenant);
        }

        // POST: api/tenants
        [HttpPost]
        public async Task<ActionResult<TenantDto>> CreateTenant(TenantDto dto)
        {

            var tenant = new Tenant
            {
                Unit = dto.Unit,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow 
            };

            _context.Tenants.Add(tenant);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // log it for your server console
                Console.WriteLine(ex);

                // return it in API response
                return BadRequest(new { message = ex.Message });
            }

            dto.Id = tenant.Id;
            return CreatedAtAction(nameof(GetTenantById), new { id = dto.Id }, dto);
        }

        // PUT: api/tenants/5
        [HttpPut("{id}")]
        public async Task<ActionResult<TenantDto>> UpdateTenant(int id, TenantDto dto)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound();
            }

           /*
            if (tenant.Unit != dto.Unit)
            {
                var newUnit = await _context.Units.FindAsync(dto.UnitId);
                if (newUnit == null)
                {
                    return NotFound("New unit not found");
                }
            }
            */

            tenant.Unit = dto.Unit;
            tenant.FirstName = dto.FirstName;
            tenant.LastName = dto.LastName;
            tenant.PhoneNumber = dto.PhoneNumber;
            tenant.Email = dto.Email;
            tenant.UpdatedAt = DateTime.UtcNow; 

            _context.Tenants.Update(tenant);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        // DELETE: api/tenants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound();
            }


            _context.Tenants.Remove(tenant);
        
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // log it for your server console
                Console.WriteLine(ex);

                // return it in API response
                return BadRequest(new { message = ex.Message });
            }

            return NoContent();
        }
    }
}