using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Leases;
using Selu383.SP25.P03.Api.Features.Tenants;
using Microsoft.AspNetCore.Identity;
using Selu383.SP25.P03.Api.Features.Users;
using Selu383.SP25.P03.Api.Features.Email;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/leases")]
    [ApiController]
    public class LeasesController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<LeasesController> _logger;

        public LeasesController(DataContext context, UserManager<User> userManager, IEmailService emailService, ILogger<LeasesController> logger)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
            _logger = logger;
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

                // Tenants only see their own lease, and only if it's Active
                if (roles.Contains(UserRoleNames.Tenant))
                {
                    leasesQuery = leasesQuery.Where(l => l.Tenant.Email.ToLower() == user.Email.ToLower() && l.Status == "Active");
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
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.Unit)
                        .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lease == null)
            {
                return NotFound();
            }

            // Check authorization for tenants - only allow viewing approved leases
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains(UserRoleNames.Tenant))
                {
                    // Tenant can only view their own lease and only if Active
                    if (lease.Tenant.Email.ToLower() != user.Email.ToLower() || lease.Status != "Active")
                    {
                        return NotFound(); // Return 404 to not reveal existence of pending/denied leases
                    }
                }
            }

            var dto = new LeaseDto
            {
                Id = lease.Id,
                UnitNumber = lease.Tenant.UnitNumber,
                TenantId = lease.TenantId,
                FirstName = lease.Tenant.FirstName,
                LastName = lease.Tenant.LastName,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                Rent = lease.Rent,
                Deposit = lease.Deposit,
                Status = lease.Status
            };

            return Ok(dto);
        }

        // POST: api/leases
        [HttpPost]
        public async Task<ActionResult<LeaseDto>> CreateLease(LeaseDto dto)
        {

            var tenant = await _context.Tenants
                .Include(t => t.Unit)
                    .ThenInclude(u => u.Property)
                        .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(t => t.Id == dto.TenantId);

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
                Status = "Pending" // Always set to Pending when created by tenant application
            };

            _context.Leases.Add(lease);
            await _context.SaveChangesAsync();

            // Send email notification to landlord
            try
            {
                var landlord = tenant.Unit?.Property?.User;
                if (landlord != null && !string.IsNullOrEmpty(landlord.Email))
                {
                    var tenantFullName = $"{tenant.FirstName} {tenant.LastName}";
                    var landlordName = landlord.UserName ?? "Landlord";

                    await _emailService.SendApplicationSubmittedEmailAsync(
                        landlord.Email,
                        landlordName,
                        tenantFullName,
                        tenant.UnitNumber
                    );

                    _logger.LogInformation($"Application notification sent to landlord {landlord.Email} for tenant {tenantFullName}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send application notification email");
                // Don't fail the lease creation if email fails
            }

            dto.Id = lease.Id;
            dto.Status = lease.Status;
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

        // POST: api/leases/5/approve
        [HttpPost("{id}/approve")]
        public async Task<ActionResult<LeaseDto>> ApproveLease(int id)
        {
            var lease = await _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.Unit)
                        .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            // Check if user is authorized (landlord of the property)
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (!roles.Contains(UserRoleNames.Admin))
                {
                    // Check if landlord owns the property
                    if (lease.Tenant?.Unit?.Property?.UserId != user.Id)
                    {
                        return Forbid();
                    }
                }
            }

            if (lease.Status != "Pending")
            {
                return BadRequest(new { message = "Only pending leases can be approved" });
            }

            lease.Status = "Active";
            _context.Leases.Update(lease);
            await _context.SaveChangesAsync();

            // Send approval email to tenant
            try
            {
                var tenant = lease.Tenant;
                if (tenant != null && !string.IsNullOrEmpty(tenant.Email))
                {
                    var tenantFullName = $"{tenant.FirstName} {tenant.LastName}";
                    var propertyName = tenant.Unit?.Property?.Name ?? "Property";

                    await _emailService.SendApplicationApprovedEmailAsync(
                        tenant.Email,
                        tenantFullName,
                        tenant.UnitNumber,
                        propertyName
                    );

                    _logger.LogInformation($"Approval notification sent to tenant {tenant.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send approval notification email");
                // Don't fail the approval if email fails
            }

            var dto = new LeaseDto
            {
                Id = lease.Id,
                UnitNumber = lease.UnitNumber,
                TenantId = lease.TenantId,
                FirstName = lease.FirstName,
                LastName = lease.LastName,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                Rent = lease.Rent,
                Deposit = lease.Deposit,
                Status = lease.Status
            };

            return Ok(dto);
        }

        // POST: api/leases/5/deny
        [HttpPost("{id}/deny")]
        public async Task<ActionResult<LeaseDto>> DenyLease(int id, [FromBody] DenyLeaseRequest request)
        {
            var lease = await _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.Unit)
                        .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            // Check if user is authorized (landlord of the property)
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (!roles.Contains(UserRoleNames.Admin))
                {
                    // Check if landlord owns the property
                    if (lease.Tenant?.Unit?.Property?.UserId != user.Id)
                    {
                        return Forbid();
                    }
                }
            }

            if (lease.Status != "Pending")
            {
                return BadRequest(new { message = "Only pending leases can be denied" });
            }

            lease.Status = "Denied";
            _context.Leases.Update(lease);
            await _context.SaveChangesAsync();

            // Send denial email to tenant
            try
            {
                var tenant = lease.Tenant;
                if (tenant != null && !string.IsNullOrEmpty(tenant.Email))
                {
                    var tenantFullName = $"{tenant.FirstName} {tenant.LastName}";
                    var propertyName = tenant.Unit?.Property?.Name ?? "Property";

                    await _emailService.SendApplicationDeniedEmailAsync(
                        tenant.Email,
                        tenantFullName,
                        tenant.UnitNumber,
                        propertyName,
                        request?.Reason
                    );

                    _logger.LogInformation($"Denial notification sent to tenant {tenant.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send denial notification email");
                // Don't fail the denial if email fails
            }

            var dto = new LeaseDto
            {
                Id = lease.Id,
                UnitNumber = lease.UnitNumber,
                TenantId = lease.TenantId,
                FirstName = lease.FirstName,
                LastName = lease.LastName,
                StartDate = lease.StartDate,
                EndDate = lease.EndDate,
                Rent = lease.Rent,
                Deposit = lease.Deposit,
                Status = lease.Status
            };

            return Ok(dto);
        }
    }

    public class DenyLeaseRequest
    {
        public string? Reason { get; set; }
    }
}