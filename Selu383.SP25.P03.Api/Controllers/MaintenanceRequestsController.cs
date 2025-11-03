using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.MaintenanceRequests;
using Selu383.SP25.P03.Api.Features.Tenants;
using Microsoft.AspNetCore.Identity;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Controllers
{
    [ApiController]
    [Route("api/maintenancerequests")]
    public class MaintenanceRequestsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<User> _userManager;

        public MaintenanceRequestsController(DataContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/maintenancerequests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRequestDto>>> GetRequests()
        {
            var user = await _userManager.GetUserAsync(User);

            // Get all requests initially
            var requestsQuery = _context.MaintenanceRequests
                .Include(r => r.Tenant)
                    .ThenInclude(t => t.Unit)
                    .ThenInclude(u => u.Property)
                .AsQueryable();

            // If user is logged in, filter based on role
            if (user != null)
            {
                var roles = await _userManager.GetRolesAsync(user);

                // Landlords only see maintenance requests for tenants in their properties
                if (roles.Contains(UserRoleNames.Landlord))
                {
                    requestsQuery = requestsQuery.Where(r => r.Tenant.Unit.Property.UserId == user.Id);
                }

                // Staff (Maintenance) only see requests for their assigned property
                if (roles.Contains(UserRoleNames.Maintenance))
                {
                    // Find the staff record by email (matches Staff.Email to User.Email)
                    var staffRecord = await _context.Staff
                        .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

                    if (staffRecord != null && staffRecord.PropertyId > 0)
                    {
                        // Filter maintenance requests to only show those for units in the staff's property
                        requestsQuery = requestsQuery.Where(r => r.Tenant.Unit.PropertyId == staffRecord.PropertyId);
                    }
                    else
                    {
                        // Staff not assigned to a property - return empty results
                        requestsQuery = requestsQuery.Where(r => false);
                    }
                }

                // Tenants only see their own maintenance requests
                if (roles.Contains(UserRoleNames.Tenant))
                {
                    requestsQuery = requestsQuery.Where(r => r.Tenant.Email.ToLower() == user.Email.ToLower());
                }
            }

            var requests = await requestsQuery
                .Select(r => new MaintenanceRequestDto
                {
                    Id = r.Id,
                    TenantId = r.TenantId,
                    UnitNumber = r.Tenant.UnitNumber,
                    Description = r.Description,
                    Status = r.Status,
                    Priority = r.Priority,
                    AssignedTo = r.AssignedTo,
                    RequestedAt = r.RequestedAt,
                    UpdatedAt = r.UpdatedAt,
                    CompletedAt = r.CompletedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        // GET: api/maintenancerequests/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequestDto>> GetRequestById(int id)
        {
            var request = await _context.MaintenanceRequests
                .Include(r => r.Tenant)
                .Where(r => r.Id == id)
                .Select(r => new MaintenanceRequestDto
                {
                    Id = r.Id,
                    TenantId = r.TenantId,
                    UnitNumber = r.Tenant.UnitNumber,
                    Description = r.Description,
                    Status = r.Status,
                    Priority = r.Priority,
                    AssignedTo = r.AssignedTo,
                    RequestedAt = r.RequestedAt,
                    UpdatedAt = r.UpdatedAt,
                    CompletedAt = r.CompletedAt
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound();
            }

            return Ok(request);
        }

        // POST: api/maintenancerequests
        [HttpPost]
        public async Task<ActionResult<MaintenanceRequestDto>> CreateRequest(MaintenanceRequestDto dto)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var roles = await _userManager.GetRolesAsync(user);

            // Find the tenant and their property
            var tenant = await _context.Tenants
                .Include(t => t.Unit)
                .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(t => t.Id == dto.TenantId);

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Role-based authorization
            if (roles.Contains(UserRoleNames.Tenant))
            {
                // Tenants can only create requests for themselves
                if (tenant.Email.ToLower() != user.Email.ToLower() &&
                    tenant.Email.ToLower() != user.UserName.ToLower())
                {
                    return Forbid();
                }
            }
            else if (roles.Contains(UserRoleNames.Landlord))
            {
                // Landlords can only create requests for tenants in their properties
                if (tenant.Unit.Property.UserId != user.Id)
                {
                    return Forbid();
                }
            }
            else if (roles.Contains(UserRoleNames.Maintenance))
            {
                // Staff can only create requests for tenants in their assigned property
                var staffRecord = await _context.Staff
                    .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

                if (staffRecord == null || staffRecord.PropertyId <= 0)
                {
                    return BadRequest(new { message = "You are not assigned to a property" });
                }

                if (tenant.Unit.PropertyId != staffRecord.PropertyId)
                {
                    return Forbid();
                }
            }
            else if (!roles.Contains(UserRoleNames.Admin))
            {
                return Forbid();
            }

            var request = new MaintenanceRequest
            {
                TenantId = dto.TenantId,
                Description = dto.Description,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Open" : dto.Status,
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Low" : dto.Priority,
                AssignedTo = dto.AssignedTo,
                RequestedAt = DateTimeOffset.UtcNow
            };

            _context.MaintenanceRequests.Add(request);
            await _context.SaveChangesAsync();

            dto.Id = request.Id;
            dto.RequestedAt = request.RequestedAt;
            dto.UnitNumber = tenant.UnitNumber;

            return CreatedAtAction(nameof(GetRequestById), new { id = dto.Id }, dto);
        }

        // PUT: api/maintenancerequests/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<MaintenanceRequestDto>> UpdateRequest(int id, MaintenanceRequestDto dto)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var roles = await _userManager.GetRolesAsync(user);

            var request = await _context.MaintenanceRequests
                .Include(r => r.Tenant)
                .ThenInclude(t => t.Unit)
                .ThenInclude(u => u.Property)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                return NotFound();
            }

            // Role-based authorization and field restrictions
            if (roles.Contains(UserRoleNames.Tenant))
            {
                // Tenants can only update their own requests
                if (request.Tenant.Email.ToLower() != user.Email.ToLower() &&
                    request.Tenant.Email.ToLower() != user.UserName.ToLower())
                {
                    return Forbid();
                }
                // Tenants can ONLY update priority
                request.Priority = dto.Priority ?? request.Priority;
            }
            else if (roles.Contains(UserRoleNames.Maintenance))
            {
                // Staff can only update requests in their assigned property
                var staffRecord = await _context.Staff
                    .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

                if (staffRecord == null || staffRecord.PropertyId <= 0)
                {
                    return BadRequest(new { message = "You are not assigned to a property" });
                }

                if (request.Tenant.Unit.PropertyId != staffRecord.PropertyId)
                {
                    return Forbid();
                }

                // Staff can update status, description, assignedTo
                request.Status = dto.Status ?? request.Status;
                request.Description = dto.Description ?? request.Description;
                request.AssignedTo = dto.AssignedTo;
                if (request.Status.ToLower() == "completed")
                {
                    request.CompletedAt = DateTimeOffset.UtcNow;
                }
            }
            else if (roles.Contains(UserRoleNames.Landlord))
            {
                // Landlords can update requests for tenants in their properties
                if (request.Tenant.Unit.Property.UserId != user.Id)
                {
                    return Forbid();
                }
                // Landlords can update all fields
                request.Description = dto.Description;
                request.Status = dto.Status ?? request.Status;
                request.Priority = dto.Priority ?? request.Priority;
                request.AssignedTo = dto.AssignedTo;
                if (request.Status.ToLower() == "completed" && request.CompletedAt == null)
                {
                    request.CompletedAt = DateTimeOffset.UtcNow;
                }
            }
            else if (!roles.Contains(UserRoleNames.Admin))
            {
                return Forbid();
            }
            else
            {
                // Admin can update everything
                request.Description = dto.Description;
                request.Status = dto.Status ?? request.Status;
                request.Priority = dto.Priority ?? request.Priority;
                request.AssignedTo = dto.AssignedTo;
            }

            request.UpdatedAt = DateTimeOffset.UtcNow;

            _context.MaintenanceRequests.Update(request);
            await _context.SaveChangesAsync();

            dto.Id = request.Id;
            dto.TenantId = request.TenantId;
            dto.UnitNumber = request.Tenant.UnitNumber;
            dto.RequestedAt = request.RequestedAt;
            dto.UpdatedAt = request.UpdatedAt;
            dto.CompletedAt = request.CompletedAt;

            return Ok(dto);
        }

        // DELETE: api/maintenancerequests/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            _context.MaintenanceRequests.Remove(request);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}