using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.MaintenanceRequests;
using Selu383.SP25.P03.Api.Features.Tenants;

namespace Selu383.SP25.P03.Api.Controllers
{
    [ApiController]
    [Route("api/maintenancerequests")]
    public class MaintenanceRequestsController : ControllerBase
    {
        private readonly DataContext _context;

        public MaintenanceRequestsController(DataContext context)
        {
            _context = context;
        }

        // GET: api/maintenancerequests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRequestDto>>> GetRequests()
        {
            var requests = await _context.MaintenanceRequests
                .Include(r => r.Tenant)
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
            var tenant = await _context.Tenants.FindAsync(dto.TenantId);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
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
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            request.Description = dto.Description;
            request.Status = dto.Status ?? request.Status;
            request.Priority = dto.Priority ?? request.Priority;
            request.AssignedTo = dto.AssignedTo;
            request.UpdatedAt = DateTimeOffset.UtcNow;

            _context.MaintenanceRequests.Update(request);
            await _context.SaveChangesAsync();

            // Load tenant to get unit number
            await _context.Entry(request).Reference(r => r.Tenant).LoadAsync();

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