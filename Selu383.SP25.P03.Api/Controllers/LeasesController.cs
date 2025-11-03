using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Leases;
using Selu383.SP25.P03.Api.Features.Tenants;
using Microsoft.AspNetCore.Identity;
using Selu383.SP25.P03.Api.Features.Users;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/leases")]
    [ApiController]
    public class LeasesController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<User> _userManager;

        public LeasesController(DataContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/leases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaseDto>>> GetLeases()
        {
            var user = await _userManager.GetUserAsync(User);

            // Get all leases initially
            var leasesQuery = _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.Unit)
                    .ThenInclude(u => u.Property)
                .AsQueryable();

            // If user is logged in, filter based on role
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);

                // Landlords only see leases for tenants in their properties
                if (roles.Contains(UserRoleNames.Landlord))
                {
                    leasesQuery = leasesQuery.Where(l => l.Tenant.Unit.Property.UserId == user.Id);
                }

                // Staff (Maintenance) only see leases for their assigned property
                if (roles.Contains(UserRoleNames.Maintenance))
                {
                    var staffRecord = await _context.Staff
                        .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

                    if (staffRecord != null)
                    {
                        leasesQuery = leasesQuery.Where(l => l.Tenant.Unit.PropertyId == staffRecord.PropertyId);
                    }
                    else
                    {
                        // Staff not found, return empty
                        return Ok(new List<LeaseDto>());
                    }
                }

                // Tenants only see their own lease
                if (roles.Contains(UserRoleNames.Tenant))
                {
                    leasesQuery = leasesQuery.Where(l => l.Tenant.Email.ToLower() == user.Email.ToLower());
                }
            }

            var leases = await leasesQuery
                .Select(l => new LeaseDto
                {
                    Id = l.Id,
                    UnitNumber = l.Tenant.UnitNumber,
                    TenantId = l.TenantId,
                    FirstName = l.Tenant.FirstName,
                    LastName = l.Tenant.LastName,
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
                    UnitNumber = l.Tenant.UnitNumber,
                    TenantId = l.TenantId,
                    FirstName = l.Tenant.FirstName,
                    LastName = l.Tenant.LastName,
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
                return NotFound(new { message = "Tenant not found" });
            }

            var existingLease = await _context.Leases
                .FirstOrDefaultAsync(l => l.TenantId == dto.TenantId);

            if (existingLease != null)
            {
                return BadRequest(new { message = "This tenant already has another lease." });
            }

            var leaseDuration = dto.EndDate.ToDateTime(TimeOnly.MinValue) - dto.StartDate.ToDateTime(TimeOnly.MinValue);

            if (dto.StartDate >= dto.EndDate)
            {
                return BadRequest(new { message = "Start date must be before end date." });
            }

            if (leaseDuration.TotalDays < 90)
            {
                return BadRequest(new { message ="Lease duration must be at least 3 months." });
            }
            
            if (dto.Rent < 0)
            {
                return BadRequest(new { message = "Rent cannot be negative." });
            }
            if (dto.Deposit < 0)
            {
                return BadRequest(new { message = "Deposit cannot be negative." });
            }

            var lease = new Lease
            {
                TenantId = dto.TenantId,
                UnitNumber = dto.UnitNumber,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
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

            var duplicateLease = await _context.Leases
                .FirstOrDefaultAsync(l => l.TenantId == dto.TenantId && l.Id != id);

            if (duplicateLease != null)
            {
                return BadRequest(new { message = "This tenant is already assigned to another lease." });
            }

            var leaseDuration = dto.EndDate.ToDateTime(TimeOnly.MinValue) - dto.StartDate.ToDateTime(TimeOnly.MinValue);

            if (dto.StartDate >= dto.EndDate)
            {
                return BadRequest(new { message = "Start date must be before end date." });
            }

            if (leaseDuration.TotalDays < 90)
            {
                return BadRequest(new { message = "Lease duration must be at least 3 months." });
            }

            if (dto.Rent < 0)
            {
                return BadRequest(new { message = "Rent cannot be negative." });
            }
            if (dto.Deposit < 0)
            {
                return BadRequest(new { message = "Deposit cannot be negative." });
            }

            lease.UnitNumber = dto.UnitNumber;
            lease.TenantId = dto.TenantId;
            lease.FirstName = dto.FirstName;
            lease.LastName = dto.LastName;
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