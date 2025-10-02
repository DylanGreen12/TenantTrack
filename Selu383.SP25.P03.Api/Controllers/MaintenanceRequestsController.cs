using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.MaintenanceRequests;

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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRequestDto>>> GetRequests()
        {
            var requests = await _context.MaintenanceRequests
                .Select(r => new MaintenanceRequestDto
                {
                    Id = r.Id,
                    TenantId = r.TenantId,
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

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequestDto>> GetRequestById(int id)
        {
            var request = await _context.MaintenanceRequests
                .Where(r => r.Id == id)
                .Select(r => new MaintenanceRequestDto
                {
                    Id = r.Id,
                    TenantId = r.TenantId,
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

            return CreatedAtAction(nameof(GetRequestById), new { id = dto.Id }, dto);
        }

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
            
            if (request.Status == "Completed" && request.CompletedAt == null)
            {
                request.CompletedAt = DateTimeOffset.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new MaintenanceRequestDto
            {
                Id = request.Id,
                TenantId = request.TenantId,
                Description = request.Description,
                Status = request.Status,
                Priority = request.Priority,
                AssignedTo = request.AssignedTo,
                RequestedAt = request.RequestedAt,
                UpdatedAt = request.UpdatedAt,
                CompletedAt = request.CompletedAt
            });
        }

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