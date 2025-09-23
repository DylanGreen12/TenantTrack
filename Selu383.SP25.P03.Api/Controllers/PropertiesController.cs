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
                    Description = p.Description,
                    Address = p.Address,
                    City = p.City,
                    State = p.State,
                    ZipCode = p.ZipCode,
                    ImageUrl = p.ImageUrl,
                    UserId = p.UserId
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
                    Description = p.Description,
                    Address = p.Address,
                    City = p.City,
                    State = p.State,
                    ZipCode = p.ZipCode,
                    ImageUrl = p.ImageUrl,
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
                Description = dto.Description,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                ImageUrl = dto.ImageUrl,
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
                var newOwner = await _context.Users.FindAsync(dto.UserId);
                if (newOwner == null)
                {
                    return NotFound("New owner not found");
                }
            }

            property.Name = dto.Name;
            property.Description = dto.Description;
            property.Address = dto.Address;
            property.City = dto.City;
            property.State = dto.State;
            property.ZipCode = dto.ZipCode;
            property.ImageUrl = dto.ImageUrl;
            property.UserId = dto.UserId;

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

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}