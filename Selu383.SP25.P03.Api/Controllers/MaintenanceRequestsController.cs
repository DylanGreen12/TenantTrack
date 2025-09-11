using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.MaintenanceRequests;

namespace Selu383.SP25.P03.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceRequestsController : ControllerBase
    {
        private readonly DataContext _context;

        public MaintenanceRequestsController(DataContext context)
        {
            _context = context;
        }

        // GET: api/maintenancerequests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRequestGetDto>>> GetMaintenanceRequests()
        {
            var requests = await _context.MaintenanceRequests
                .Select(r => new MaintenanceRequestGetDto
                {
                    Id = r.Id,
                    PropertyId = r.PropertyId,
                    Description = r.Description,
                    Status = r.Status,
                    TimeCreated = r.TimeCreated,
                    TimeScheduled = r.TimeScheduled,
                    CreatedByUserId = r.CreatedByUserId
                })
                .ToListAsync();

            return Ok(requests);
        }

        // GET: api/maintenancerequests/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequestGetDto>> GetMaintenanceRequest(int id)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);

            if (request == null)
            {
                return NotFound();
            }

            return new MaintenanceRequestGetDto
            {
                Id = request.Id,
                PropertyId = request.PropertyId,
                Description = request.Description,
                Status = request.Status,
                TimeCreated = request.TimeCreated,
                TimeScheduled = request.TimeScheduled,
                CreatedByUserId = request.CreatedByUserId
            };
        }

        // POST: api/maintenancerequests
        [HttpPost]
        public async Task<ActionResult<MaintenanceRequestGetDto>> Create(MaintenanceRequestCreateDto dto)
        {
            var maintenanceRequest = new MaintenanceRequest
            {
                PropertyId = dto.PropertyId,
                Description = dto.Description,
                Status = dto.Status,
                TimeCreated = DateTimeOffset.UtcNow,
                TimeScheduled = dto.TimeScheduled,
                CreatedByUserId = dto.CreatedByUserId
            };

            _context.MaintenanceRequests.Add(maintenanceRequest);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaintenanceRequest), new { id = maintenanceRequest.Id }, new MaintenanceRequestGetDto
            {
                Id = maintenanceRequest.Id,
                PropertyId = maintenanceRequest.PropertyId,
                Description = maintenanceRequest.Description,
                Status = maintenanceRequest.Status,
                TimeCreated = maintenanceRequest.TimeCreated,
                TimeScheduled = maintenanceRequest.TimeScheduled,
                CreatedByUserId = maintenanceRequest.CreatedByUserId
            });
        }

        // PUT: api/maintenancerequests/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaintenanceRequest(int id, MaintenanceRequestUpdateDto dto)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            request.Description = dto.Description;
            request.Status = dto.Status;
            request.TimeScheduled = dto.TimeScheduled;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/maintenancerequests/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaintenanceRequest(int id)
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

