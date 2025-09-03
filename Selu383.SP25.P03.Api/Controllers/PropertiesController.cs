using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Properties;
using Selu383.SP25.P03.Api.Features.Users;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/properties")]
    [ApiController]
    public class PropertiesController : ControllerBase
    {
        private readonly DataContext _context;

        public PropertiesController(DataContext context)
        {
            _context = context;
        }

        // GET: api/properties
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PropertyDto>>> GetProperties()
        {
            var properties = await _context.Properties
                .Select(p => new PropertyDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Address = p.Address,
                    City = p.City,
                    State = p.State,
                    ZipCode = p.ZipCode,
                    UserId = p.UserId // we can display the owner via front end by grabbing name from user id if we figure out the authen issue
                })
                .ToListAsync();

            return Ok(properties);
        }

        // GET: api/properties/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PropertyDto>> GetPropertyById(int id)
        {
            var property = await _context.Properties
                .Where(p => p.Id == id)
                .Select(p => new PropertyDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Address = p.Address,
                    City = p.City,
                    State = p.State,
                    ZipCode = p.ZipCode,
                    UserId = p.UserId 
                })
                .FirstOrDefaultAsync();

            if (property == null)
            {
                return NotFound();
            }

            return Ok(property);
        }

        // POST: api/properties
        [HttpPost]
        public async Task<ActionResult<PropertyDto>> CreateProperty(PropertyDto dto)
        {
            
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var property = new Property
            {
                Name = dto.Name,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                UserId = dto.UserId 
            };

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            dto.Id = property.Id;
            return CreatedAtAction(nameof(GetPropertyById), new { id = dto.Id }, dto);
        }

        // PUT: api/properties/5
        [HttpPut("{id}")]
        public async Task<ActionResult<PropertyDto>> UpdateProperty(int id, PropertyDto dto)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return NotFound();
            }

           
            if (property.UserId != dto.UserId)
            {
                var newUser = await _context.Users.FindAsync(dto.UserId);
                if (newUser == null)
                {
                    return NotFound("New user not found");
                }
            }

            property.Name = dto.Name;
            property.Address = dto.Address;
            property.City = dto.City;
            property.State = dto.State;
            property.ZipCode = dto.ZipCode;
            property.UserId = dto.UserId; // Changed from OwnerId to UserId

            _context.Properties.Update(property);
            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        // DELETE: api/properties/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return NotFound();
            }

            // TODO: Add tenant 
            // var hasTenants = await _context.Tenants.AnyAsync(t => t.PropertyId == id);
            // if (hasTenants)
            // {
            //     return BadRequest("Cannot delete property with active tenants");
            // }

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}