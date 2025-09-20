using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Units;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Selu383.SP25.P03.Api.Features.Units.Controllers
{
    [Route("api/units")]
    [ApiController]
    public class UnitsController : ControllerBase
    {
        private readonly DataContext _context;

        public UnitsController(DataContext context)
        {
            _context = context;
        }

        // GET: api/units
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UnitDto>>> GetUnits()
        {
            return await _context.Units
                .Select(u => new UnitDto
                {
                    Id = u.Id,
                    UnitNumber = u.UnitNumber,
                    PropertyId = u.PropertyId,
                    Description = u.Description,
                    ImageUrl = u.ImageUrl,
                    Bedrooms = u.Bedrooms,
                    Bathrooms = u.Bathrooms,
                    SquareFeet = u.SquareFeet,
                    Rent = u.Rent,
                    Status = u.Status
                })
                .ToListAsync();
        }

        // GET: api/units/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UnitDto>> GetUnit(int id)
        {
            var unit = await _context.Units.FindAsync(id);

            if (unit == null)
            {
                return NotFound();
            }

            return new UnitDto
            {
                Id = unit.Id,
                UnitNumber = unit.UnitNumber,
                PropertyId = unit.PropertyId,
                Description = unit.Description,
                ImageUrl = unit.ImageUrl,
                Bedrooms = unit.Bedrooms,
                Bathrooms = unit.Bathrooms,
                SquareFeet = unit.SquareFeet,
                Rent = unit.Rent,
                Status = unit.Status
            };
        }

        // GET: api/units/property/5
        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<IEnumerable<UnitDto>>> GetUnitsByProperty(int propertyId)
        {
            var units = await _context.Units
                .Where(u => u.PropertyId == propertyId)
                .Select(u => new UnitDto
                {
                    Id = u.Id,
                    UnitNumber = u.UnitNumber,
                    PropertyId = u.PropertyId,
                    Description = u.Description,
                    ImageUrl = u.ImageUrl,
                    Bedrooms = u.Bedrooms,
                    Bathrooms = u.Bathrooms,
                    SquareFeet = u.SquareFeet,
                    Rent = u.Rent,
                    Status = u.Status
                })
                .ToListAsync();

            return Ok(units);
        }

        // POST: api/units
        [HttpPost]
        public async Task<ActionResult<UnitDto>> PostUnit(UnitDto unitDto)
        {
            // Verify property exists
            var property = await _context.Properties.FindAsync(unitDto.PropertyId);
            if (property == null)
            {
                return NotFound("Property not found");
            }

            var unit = new Unit
            {
                UnitNumber = unitDto.UnitNumber,
                PropertyId = unitDto.PropertyId,
                Description = unitDto.Description,
                ImageUrl = unitDto.ImageUrl,
                Bedrooms = unitDto.Bedrooms,
                Bathrooms = unitDto.Bathrooms,
                SquareFeet = unitDto.SquareFeet,
                Rent = unitDto.Rent,
                Status = unitDto.Status
            };

            _context.Units.Add(unit);
            await _context.SaveChangesAsync();

            unitDto.Id = unit.Id;
            return CreatedAtAction("GetUnit", new { id = unit.Id }, unitDto);
        }

        // PUT: api/units/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUnit(int id, UnitDto unitDto)
        {
            if (id != unitDto.Id)
            {
                return BadRequest();
            }

            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return NotFound();
            }

            // Verify property exists if changing property
            if (unit.PropertyId != unitDto.PropertyId)
            {
                var property = await _context.Properties.FindAsync(unitDto.PropertyId);
                if (property == null)
                {
                    return NotFound("Property not found");
                }
            }

            unit.UnitNumber = unitDto.UnitNumber;
            unit.PropertyId = unitDto.PropertyId;
            unit.Description = unitDto.Description;
            unit.ImageUrl = unitDto.ImageUrl;
            unit.Bedrooms = unitDto.Bedrooms;
            unit.Bathrooms = unitDto.Bathrooms;
            unit.SquareFeet = unitDto.SquareFeet;
            unit.Rent = unitDto.Rent;
            unit.Status = unitDto.Status;

            _context.Entry(unit).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/units/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return NotFound();
            }

            _context.Units.Remove(unit);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}