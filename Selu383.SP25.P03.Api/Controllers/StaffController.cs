using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Staff;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/staff")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        private readonly DataContext _context;

        public StaffController(DataContext context)
        {
            _context = context;
        }

        // GET: api/staff
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StaffDto>>> GetStaff()
        {
            var staff = await _context.Staff
                .Select(s => new StaffDto
                {
                    Id = s.Id,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Email = s.Email,
                    Phone = s.Phone,
                    Position = s.Position,
                    PropertyId = s.PropertyId,
                    UserId = s.UserId
                })
                .ToListAsync();

            return Ok(staff);
        }

        // GET: api/staff/5
        [HttpGet("{id}")]
        public async Task<ActionResult<StaffDto>> GetStaffById(int id)
        {
            var staff = await _context.Staff
                .Where(s => s.Id == id)
                .Select(s => new StaffDto
                {
                    Id = s.Id,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Email = s.Email,
                    Phone = s.Phone,
                    Position = s.Position,
                    PropertyId = s.PropertyId,
                    UserId = s.UserId
                })
                .FirstOrDefaultAsync();

            if (staff == null)
            {
                return NotFound();
            }

            return Ok(staff);
        }

        // POST: api/staff
        [HttpPost]
        public async Task<ActionResult<StaffDto>> CreateStaff(StaffDto dto)
        {
            var property = await _context.Properties.FindAsync(dto.PropertyId);
            if (property == null)
            {
                return NotFound("Property not found");
            }

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var staff = new Staff
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                Position = dto.Position,
                PropertyId = dto.PropertyId,
                UserId = dto.UserId
            };

            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();

            dto.Id = staff.Id;
            return CreatedAtAction(nameof(GetStaffById), new { id = dto.Id }, dto);
        }

        // PUT: api/staff/5
        [HttpPut("{id}")]
        public async Task<ActionResult<StaffDto>> UpdateStaff(int id, StaffDto dto)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound();
            }

            if (staff.PropertyId != dto.PropertyId)
            {
                var property = await _context.Properties.FindAsync(dto.PropertyId);
                if (property == null)
                {
                    return NotFound("Property not found");
                }
            }

            if (staff.UserId != dto.UserId)
            {
                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                {
                    return NotFound("User not found");
                }
            }

            staff.FirstName = dto.FirstName;
            staff.LastName = dto.LastName;
            staff.Email = dto.Email;
            staff.Phone = dto.Phone;
            staff.Position = dto.Position;
            staff.PropertyId = dto.PropertyId;
            staff.UserId = dto.UserId;

            _context.Staff.Update(staff);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        // DELETE: api/staff/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStaff(int id)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound();
            }

            _context.Staff.Remove(staff);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}