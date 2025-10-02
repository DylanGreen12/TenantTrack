using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/landlord")]
    [ApiController]
    [Authorize]
    public class LandlordController : ControllerBase
    {
        private readonly DataContext _context;

        public LandlordController(DataContext context)
        {
            _context = context;
        }

        // GET: api/landlord/dashboard
        [HttpGet("dashboard")]
        public async Task<ActionResult<LandlordDashboardDto>> GetLandlordDashboard()
        {
            // Get current user ID from authentication
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Get all properties owned by this landlord
            var properties = await _context.Properties
                .Where(p => p.UserId == userId)
                .Include(p => p.User)
                .Select(p => new PropertySummaryDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Address = p.Address,
                    City = p.City,
                    State = p.State,
                    ZipCode = p.ZipCode,
                    ImageUrl = p.ImageUrl
                })
                .ToListAsync();

            // Get all units for these properties
            var propertyIds = properties.Select(p => p.Id).ToList();
            var units = await _context.Units
                .Where(u => propertyIds.Contains(u.PropertyId))
                .Select(u => new UnitSummaryDto
                {
                    Id = u.Id,
                    UnitNumber = u.UnitNumber,
                    PropertyId = u.PropertyId,
                    Bedrooms = u.Bedrooms,
                    Bathrooms = u.Bathrooms,
                    Rent = u.Rent,
                    Status = u.Status
                })
                .ToListAsync();

            // Get all leases for units in these properties
            var unitNumbers = units.Select(u => u.UnitNumber).ToList();
            var leases = await _context.Leases
                .Where(l => unitNumbers.Contains(l.UnitNumber))
                .Include(l => l.Tenant)
                .Select(l => new LeaseDetailsDto
                {
                    Id = l.Id,
                    UnitNumber = l.UnitNumber,
                    TenantId = l.TenantId,
                    TenantFirstName = l.FirstName,
                    TenantLastName = l.LastName,
                    TenantEmail = l.Tenant.Email,
                    TenantPhone = l.Tenant.PhoneNumber,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Rent = l.Rent,
                    Deposit = l.Deposit,
                    Status = l.Status
                })
                .ToListAsync();

            // Get staff members (owners) for contact info
            var owners = await _context.Staff
                .Where(s => propertyIds.Contains(s.PropertyId) && s.Position.ToLower() == "owner")
                .Select(s => new OwnerContactDto
                {
                    PropertyId = s.PropertyId,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Email = s.Email,
                    Phone = s.Phone
                })
                .ToListAsync();

            // Calculate summary statistics
            var totalUnits = units.Count;
            var occupiedUnits = units.Count(u => u.Status.ToLower() == "rented");
            var availableUnits = units.Count(u => u.Status.ToLower() == "available");
            var activeLeases = leases.Count(l => l.Status.ToLower() == "active");
            var totalMonthlyRent = leases.Where(l => l.Status.ToLower() == "active").Sum(l => l.Rent);

            return new LandlordDashboardDto
            {
                Properties = properties,
                Units = units,
                Leases = leases,
                Owners = owners,
                Summary = new DashboardSummaryDto
                {
                    TotalProperties = properties.Count,
                    TotalUnits = totalUnits,
                    OccupiedUnits = occupiedUnits,
                    AvailableUnits = availableUnits,
                    ActiveLeases = activeLeases,
                    TotalMonthlyRent = totalMonthlyRent
                }
            };
        }
    }

    // DTOs
    public class LandlordDashboardDto
    {
        public required List<PropertySummaryDto> Properties { get; set; }
        public required List<UnitSummaryDto> Units { get; set; }
        public required List<LeaseDetailsDto> Leases { get; set; }
        public required List<OwnerContactDto> Owners { get; set; }
        public required DashboardSummaryDto Summary { get; set; }
    }

    public class PropertySummaryDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Address { get; set; }
        public required string City { get; set; }
        public required string State { get; set; }
        public required string ZipCode { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class UnitSummaryDto
    {
        public int Id { get; set; }
        public required string UnitNumber { get; set; }
        public int PropertyId { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal Rent { get; set; }
        public required string Status { get; set; }
    }

    public class LeaseDetailsDto
    {
        public int Id { get; set; }
        public required string UnitNumber { get; set; }
        public int TenantId { get; set; }
        public required string TenantFirstName { get; set; }
        public required string TenantLastName { get; set; }
        public required string TenantEmail { get; set; }
        public required string TenantPhone { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public decimal Rent { get; set; }
        public decimal Deposit { get; set; }
        public required string Status { get; set; }
    }

    public class OwnerContactDto
    {
        public int PropertyId { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
    }

    public class DashboardSummaryDto
    {
        public int TotalProperties { get; set; }
        public int TotalUnits { get; set; }
        public int OccupiedUnits { get; set; }
        public int AvailableUnits { get; set; }
        public int ActiveLeases { get; set; }
        public decimal TotalMonthlyRent { get; set; }
    }
}