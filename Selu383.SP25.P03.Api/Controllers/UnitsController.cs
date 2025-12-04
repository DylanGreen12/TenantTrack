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
                return NotFound(new { message = "Property not found" });
            }

            // Check for duplicate unit number in the property
            var existingUnit = await _context.Units
                .FirstOrDefaultAsync(u => u.PropertyId == unitDto.PropertyId && u.UnitNumber == unitDto.UnitNumber);

            if (existingUnit != null)
            {
                return BadRequest(new { message = $"Unit number {unitDto.UnitNumber} already exists in this property" });
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

        // POST: api/units/bulk
        [HttpPost("bulk")]
        public async Task<ActionResult> PostBulkUnits(BulkUnitCreateDto bulkDto)
        {
            // Verify property exists
            var property = await _context.Properties.FindAsync(bulkDto.PropertyId);
            if (property == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            // Validate unit numbers are provided
            if (bulkDto.UnitNumbers == null || !bulkDto.UnitNumbers.Any())
            {
                return BadRequest(new { message = "At least one unit number is required" });
            }

            // Check for duplicate unit numbers in the property
            var existingUnitNumbers = await _context.Units
                .Where(u => u.PropertyId == bulkDto.PropertyId && bulkDto.UnitNumbers.Contains(u.UnitNumber))
                .Select(u => u.UnitNumber)
                .ToListAsync();

            if (existingUnitNumbers.Any())
            {
                return BadRequest(new { message = $"Unit numbers already exist: {string.Join(", ", existingUnitNumbers)}" });
            }

            // Create units
            var createdUnits = new List<Unit>();
            foreach (var unitNumber in bulkDto.UnitNumbers)
            {
                var unit = new Unit
                {
                    UnitNumber = unitNumber,
                    PropertyId = bulkDto.PropertyId,
                    Description = bulkDto.Description,
                    ImageUrl = bulkDto.ImageUrl,
                    Bedrooms = bulkDto.Bedrooms,
                    Bathrooms = bulkDto.Bathrooms,
                    SquareFeet = bulkDto.SquareFeet,
                    Rent = bulkDto.Rent,
                    Status = bulkDto.Status ?? "Available"
                };
                createdUnits.Add(unit);
            }

            _context.Units.AddRange(createdUnits);
            await _context.SaveChangesAsync();

            var createdDtos = createdUnits.Select(u => new UnitDto
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
            }).ToList();

            return Ok(new { message = $"Created {createdUnits.Count} units successfully", units = createdDtos });
        }

        // PUT: api/units/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUnit(int id, UnitDto unitDto)
        {
            if (id != unitDto.Id)
            {
                return BadRequest(new {message = "Mismatch of ids."});
            }

            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return NotFound(new {message = "Unit not found."});
            }

            // Verify property exists if changing property
            if (unit.PropertyId != unitDto.PropertyId)
            {
                var property = await _context.Properties.FindAsync(unitDto.PropertyId);
                if (property == null)
                {
                    return NotFound(new { message = "Property not found" });
                }
            }

            // Track if unit number is changing for cascade update
            var oldUnitNumber = unit.UnitNumber;
            var unitNumberChanged = oldUnitNumber != unitDto.UnitNumber;

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

            // Cascade update unit number to related tenants and leases
            if (unitNumberChanged)
            {
                var tenants = await _context.Tenants.Where(t => t.UnitNumber == oldUnitNumber).ToListAsync();
                foreach (var tenant in tenants)
                {
                    tenant.UnitNumber = unitDto.UnitNumber;
                }

                var leases = await _context.Leases.Where(l => l.UnitNumber == oldUnitNumber).ToListAsync();
                foreach (var lease in leases)
                {
                    lease.UnitNumber = unitDto.UnitNumber;
                }
            }

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

            // Check if there are any tenants assigned to this unit
            var hasTenants = await _context.Tenants.AnyAsync(t => t.UnitId == id);
            if (hasTenants)
            {
                return BadRequest(new { message = "Cannot delete unit that has tenants assigned." });
            }

            _context.Units.Remove(unit);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}