using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Staff;
using System.Text.RegularExpressions;

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

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private bool IsValidPhoneNumber(string phoneNumber)
        {
            // Remove all non-digit characters
            var digitsOnly = Regex.Replace(phoneNumber, @"\D", "");
            // Check if it's a valid US phone number (10 digits) or international format
            return digitsOnly.Length >= 10 && digitsOnly.Length <= 15;
        }

        private bool IsValidName(string name)
        {
            return !string.IsNullOrWhiteSpace(name) && 
                   name.Trim().Length >= 2 && 
                   name.Trim().Length <= 50 &&
                   !name.Any(char.IsDigit);
        }

        private bool IsValidPosition(string position)
        {
            return !string.IsNullOrWhiteSpace(position) && 
                   position.Trim().Length >= 2 && 
                   position.Trim().Length <= 50;
        }

        private async Task<bool> IsEmailUniqueAsync(string email, int? excludeStaffId = null)
        {
            var query = _context.Staff.Where(s => s.Email.ToLower() == email.ToLower());
            if (excludeStaffId.HasValue)
            {
                query = query.Where(s => s.Id != excludeStaffId.Value);
            }
            return !await query.AnyAsync();
        }

        private async Task<bool> IsPropertyValidAsync(int propertyId)
        {
            return await _context.Properties.AnyAsync(p => p.Id == propertyId);
        }

        // GET: api/staff
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StaffDto>>> GetStaff()
        {
            var staff = await _context.Staff
                .Include(s => s.Property)
                .Select(s => new StaffDto
                {
                    Id = s.Id,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Email = s.Email,
                    Phone = s.Phone,
                    Position = s.Position,
                    PropertyId = s.PropertyId,
                    PropertyName = s.Property.Name
                })
                .ToListAsync();

            return Ok(staff);
        }

        // GET: api/staff/5
        [HttpGet("{id}")]
        public async Task<ActionResult<StaffDto>> GetStaffById(int id)
        {
            var staff = await _context.Staff
                .Include(s => s.Property)
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
                    PropertyName = s.Property.Name
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
            // Validate ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate required fields
            if (dto == null)
            {
                return BadRequest(new { message = "Staff data is required" });
            }

            // Validate first name
            if (!IsValidName(dto.FirstName))
            {
                return BadRequest(new { message = "First name must be between 2-50 characters and contain no digits" });
            }

            // Validate last name
            if (!IsValidName(dto.LastName))
            {
                return BadRequest(new { message = "Last name must be between 2-50 characters and contain no digits" });
            }

            // Validate email format
            if (!IsValidEmail(dto.Email))
            {
                return BadRequest(new { message = "Invalid email format" });
            }

            // Validate email uniqueness
            if (!await IsEmailUniqueAsync(dto.Email))
            {
                return BadRequest(new { message = "Email address is already in use" });
            }

            // Validate phone number
            if (!IsValidPhoneNumber(dto.Phone))
            {
                return BadRequest(new { message = "Phone number must be between 10-15 digits" });
            }

            // Validate position
            if (!IsValidPosition(dto.Position))
            {
                return BadRequest(new { message = "Position must be between 2-50 characters" });
            }

            // Validate property exists
            if (!await IsPropertyValidAsync(dto.PropertyId))
            {
                return BadRequest(new { message = "Property does not exist" });
            }

            var staff = new Staff
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = dto.Email.Trim().ToLower(),
                Phone = dto.Phone.Trim(),
                Position = dto.Position.Trim(),
                PropertyId = dto.PropertyId
            };

            _context.Staff.Add(staff);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Log the exception
                Console.WriteLine($"Database error creating staff: {ex.Message}");
                
                // Check for specific database constraint violations
                if (ex.InnerException?.Message.Contains("UNIQUE") == true)
                {
                    return BadRequest(new { message = "Email address is already in use" });
                }
                
                return BadRequest(new { message = "Failed to create staff member due to database constraint violation" });
            }
            catch (Exception ex)
            {
                // Log it for your server console
                Console.WriteLine($"Unexpected error creating staff: {ex.Message}");

                // return it in API response
                return BadRequest(new { message = "An unexpected error occurred while creating the staff member" });
            }

            // Reload with related data for response
            var createdStaff = await _context.Staff
                .Include(s => s.Property)
                .Where(s => s.Id == staff.Id)
                .Select(s => new StaffDto
                {
                    Id = s.Id,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Email = s.Email,
                    Phone = s.Phone,
                    Position = s.Position,
                    PropertyId = s.PropertyId,
                    PropertyName = s.Property.Name
                })
                .FirstAsync();

            return CreatedAtAction(nameof(GetStaffById), new { id = createdStaff.Id }, createdStaff);
        }

        // PUT: api/staff/5
        [HttpPut("{id}")]
        public async Task<ActionResult<StaffDto>> UpdateStaff(int id, StaffDto dto)
        {
            // Validate ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate ID mismatch
            if (id != dto.Id)
            {
                return BadRequest(new { message = "ID mismatch between URL and request body" });
            }

            // Validate required fields
            if (dto == null)
            {
                return BadRequest(new { message = "Staff data is required" });
            }

            var staff = await _context.Staff.FindAsync(id);
            if (staff == null)
            {
                return NotFound(new { message = "Staff member not found" });
            }

            // Validate first name
            if (!IsValidName(dto.FirstName))
            {
                return BadRequest(new { message = "First name must be between 2-50 characters and contain no digits" });
            }

            // Validate last name
            if (!IsValidName(dto.LastName))
            {
                return BadRequest(new { message = "Last name must be between 2-50 characters and contain no digits" });
            }

            // Validate email format
            if (!IsValidEmail(dto.Email))
            {
                return BadRequest(new { message = "Invalid email format" });
            }

            // Validate email uniqueness (excluding current staff)
            if (!await IsEmailUniqueAsync(dto.Email, id))
            {
                return BadRequest(new { message = "Email address is already in use by another staff member" });
            }

            // Validate phone number
            if (!IsValidPhoneNumber(dto.Phone))
            {
                return BadRequest(new { message = "Phone number must be between 10-15 digits" });
            }

            // Validate position
            if (!IsValidPosition(dto.Position))
            {
                return BadRequest(new { message = "Position must be between 2-50 characters" });
            }

            // Validate property exists
            if (!await IsPropertyValidAsync(dto.PropertyId))
            {
                return BadRequest(new { message = "Property does not exist" });
            }

            // Update staff properties
            staff.FirstName = dto.FirstName.Trim();
            staff.LastName = dto.LastName.Trim();
            staff.Email = dto.Email.Trim().ToLower();
            staff.Phone = dto.Phone.Trim();
            staff.Position = dto.Position.Trim();
            staff.PropertyId = dto.PropertyId;

            _context.Staff.Update(staff);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Log the exception
                Console.WriteLine($"Database error updating staff: {ex.Message}");
                
                // Check for specific database constraint violations
                if (ex.InnerException?.Message.Contains("UNIQUE") == true)
                {
                    return BadRequest(new { message = "Email address is already in use by another staff member" });
                }
                
                return BadRequest(new { message = "Failed to update staff member due to database constraint violation" });
            }
            catch (Exception ex)
            {
                // Log it for your server console
                Console.WriteLine($"Unexpected error updating staff: {ex.Message}");

                // return it in API response
                return BadRequest(new { message = "An unexpected error occurred while updating the staff member" });
            }

            // Reload with related data for response
            var updatedStaff = await _context.Staff
                .Include(s => s.Property)
                .Where(s => s.Id == staff.Id)
                .Select(s => new StaffDto
                {
                    Id = s.Id,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Email = s.Email,
                    Phone = s.Phone,
                    Position = s.Position,
                    PropertyId = s.PropertyId,
                    PropertyName = s.Property.Name
                })
                .FirstAsync();

            return Ok(updatedStaff);
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