using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP25.P03.Api.Data;
using Selu383.SP25.P03.Api.Features.Tenants;
using Selu383.SP25.P03.Api.Features.Units;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Controllers
{
    [Route("api/tenants")]
    [ApiController]
    public class TenantsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<User> _userManager;

        public TenantsController(DataContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
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

        private async Task<bool> IsEmailUniqueAsync(string email, int? excludeTenantId = null)
        {
            var query = _context.Tenants.Where(t => t.Email.ToLower() == email.ToLower());
            if (excludeTenantId.HasValue)
            {
                query = query.Where(t => t.Id != excludeTenantId.Value);
            }
            return !await query.AnyAsync();
        }

        private async Task<bool> IsUnitAvailableAsync(int unitId)
        {
            var unit = await _context.Units.FindAsync(unitId);
            if (unit == null)
                return false;
            
            // Check if unit exists and is available
            return unit.Status == "Available";
        }

        /*
        [HttpGet("me/unit")]
        [Authorize(Roles = UserRoleNames.Tenant)] 
        public async Task<ActionResult<UnitDto>> GetMyUnit()
        {
            var user = await _userManager.GetUserAsync(User); 
            if (user == null)
            {
                return Unauthorized(new { message = "Not logged in" });
            }

            var tenant = await _context.Tenants
                .Include(t => t.Unit)
                .FirstOrDefaultAsync(t => t.Email.ToLower() == user.Email.ToLower());

            if (tenant == null)
            {
                return NotFound(new { message = "No tenant record found for this user" });
            }

            if (tenant.Unit == null)
            {
                return NotFound(new { message = "No unit assigned" });
            }

            return Ok(new UnitDto
            {
                Id = tenant.Unit.Id,
                UnitNumber = tenant.Unit.UnitNumber,
                Rent = tenant.Unit.Rent,
                ImageUrl = tenant.Unit.ImageUrl,
                Description = tenant.Unit.Description,
                Bedrooms = tenant.Unit.Bedrooms,
                Bathrooms = tenant.Unit.Bathrooms
            });
        }
        */

        // GET: api/tenants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TenantDto>>> GetTenants()
        {
            var user = await _userManager.GetUserAsync(User);

            // If no user is logged in, return all tenants (for backwards compatibility with existing code)
            // In production, you might want to require authentication
            if (user == null)
            {
                var allTenants = await _context.Tenants
                    .Select(t => new TenantDto
                    {
                        Id = t.Id,
                        UnitId = t.UnitId,
                        UnitNumber = t.Unit.UnitNumber,
                        FirstName = t.FirstName,
                        LastName = t.LastName,
                        PhoneNumber = t.PhoneNumber,
                        Email = t.Email,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt
                    })
                    .ToListAsync();
                return Ok(allTenants);
            }

            var roles = await _userManager.GetRolesAsync(user);

            // Admin and Maintenance staff can see all tenants
            if (roles.Contains(UserRoleNames.Admin) || roles.Contains(UserRoleNames.Maintenance))
            {
                var allTenants = await _context.Tenants
                    .Select(t => new TenantDto
                    {
                        Id = t.Id,
                        UnitId = t.UnitId,
                        UnitNumber = t.Unit.UnitNumber,
                        FirstName = t.FirstName,
                        LastName = t.LastName,
                        PhoneNumber = t.PhoneNumber,
                        Email = t.Email,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt
                    })
                    .ToListAsync();
                return Ok(allTenants);
            }

            // Landlords can only see tenants in their properties
            if (roles.Contains(UserRoleNames.Landlord))
            {
                var landlordTenants = await _context.Tenants
                    .Where(t => t.Unit.Property.UserId == user.Id)
                    .Select(t => new TenantDto
                    {
                        Id = t.Id,
                        UnitId = t.UnitId,
                        UnitNumber = t.Unit.UnitNumber,
                        FirstName = t.FirstName,
                        LastName = t.LastName,
                        PhoneNumber = t.PhoneNumber,
                        Email = t.Email,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt
                    })
                    .ToListAsync();
                return Ok(landlordTenants);
            }

            // Staff (Maintenance) can only see tenants in their assigned property
            if (roles.Contains(UserRoleNames.Maintenance))
            {
                // Find the staff record by email (matches Staff.Email to User.Email)
                var staffRecord = await _context.Staff
                    .FirstOrDefaultAsync(s => s.Email.ToLower() == user.Email.ToLower());

                if (staffRecord != null)
                {
                    var staffTenants = await _context.Tenants
                        .Where(t => t.Unit.PropertyId == staffRecord.PropertyId)
                        .Select(t => new TenantDto
                        {
                            Id = t.Id,
                            UnitId = t.UnitId,
                            UnitNumber = t.Unit.UnitNumber,
                            FirstName = t.FirstName,
                            LastName = t.LastName,
                            PhoneNumber = t.PhoneNumber,
                            Email = t.Email,
                            CreatedAt = t.CreatedAt,
                            UpdatedAt = t.UpdatedAt
                        })
                        .ToListAsync();
                    return Ok(staffTenants);
                }

                // If staff record not found, return empty list
                return Ok(new List<TenantDto>());
            }

            // Tenants can only see their own record
            if (roles.Contains(UserRoleNames.Tenant))
            {
                var myTenant = await _context.Tenants
                    .Where(t => t.Email.ToLower() == user.Email.ToLower())
                    .Select(t => new TenantDto
                    {
                        Id = t.Id,
                        UnitId = t.UnitId,
                        UnitNumber = t.Unit.UnitNumber,
                        FirstName = t.FirstName,
                        LastName = t.LastName,
                        PhoneNumber = t.PhoneNumber,
                        Email = t.Email,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt
                    })
                    .ToListAsync();
                return Ok(myTenant);
            }

            // Default: return empty list if user has no recognized role
            return Ok(new List<TenantDto>());
        }

        // GET: api/tenants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TenantDto>> GetTenantById(int id)
        {
            var tenant = await _context.Tenants
                .Where(t => t.Id == id)
                .Select(t => new TenantDto
                {
                    Id = t.Id,
                    UnitId = t.UnitId,
                    UnitNumber = t.Unit.UnitNumber,
                    FirstName = t.FirstName,
                    LastName = t.LastName,
                    PhoneNumber = t.PhoneNumber,
                    Email = t.Email,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt 
                })
                .FirstOrDefaultAsync();

            if (tenant == null)
            {
                return NotFound();
            }

            return Ok(tenant);
        }

        // POST: api/tenants
        [HttpPost]
        public async Task<ActionResult<TenantDto>> CreateTenant(TenantDto dto)
        {
            // Validate ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate required fields
            if (dto == null)
            {
                return BadRequest(new { message = "Tenant data is required" });
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
            if (!IsValidPhoneNumber(dto.PhoneNumber))
            {
                return BadRequest(new { message = "Phone number must be between 10-15 digits" });
            }

            // Validate unit exists and is available
            if (!await IsUnitAvailableAsync(dto.UnitId))
            {
                return BadRequest(new { message = "Unit does not exist or is not available for tenant assignment" });
            }

            // Update unit status to "Rented"
            var unit = await _context.Units.FindAsync(dto.UnitId);
            if (unit != null)
            {
                unit.Status = "Rented";
                _context.Units.Update(unit);
            }

            var tenant = new Tenant
            {
                UnitId = dto.UnitId,
                UnitNumber = dto.UnitNumber,
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = dto.Email.Trim().ToLower(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow 
            };

            _context.Tenants.Add(tenant);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Log the exception
                Console.WriteLine($"Database error creating tenant: {ex.Message}");
                
                // Check for specific database constraint violations
                if (ex.InnerException?.Message.Contains("UNIQUE") == true)
                {
                    return BadRequest(new { message = "Email address is already in use" });
                }
                
                return BadRequest(new { message = "Failed to create tenant due to database constraint violation" });
            }
            catch (Exception ex)
            {
                // Log it for your server console
                Console.WriteLine($"Unexpected error creating tenant: {ex.Message}");

                // return it in API response
                return BadRequest(new { message = "An unexpected error occurred while creating the tenant" });
            }

            dto.Id = tenant.Id;
            dto.CreatedAt = tenant.CreatedAt;
            dto.UpdatedAt = tenant.UpdatedAt;
            return CreatedAtAction(nameof(GetTenantById), new { id = dto.Id }, dto);
        }

        // PUT: api/tenants/5
        [HttpPut("{id}")]
        public async Task<ActionResult<TenantDto>> UpdateTenant(int id, TenantDto dto)
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
                return BadRequest(new { message = "Tenant data is required" });
            }

            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
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

            // Validate email uniqueness (excluding current tenant)
            if (!await IsEmailUniqueAsync(dto.Email, id))
            {
                return BadRequest(new { message = "Email address is already in use by another tenant" });
            }

            // Validate phone number
            if (!IsValidPhoneNumber(dto.PhoneNumber))
            {
                return BadRequest(new { message = "Phone number must be between 10-15 digits" });
            }

            // Handle unit changes
            if (tenant.UnitId != dto.UnitId)
            {
                // Validate new unit exists and is available
                if (!await IsUnitAvailableAsync(dto.UnitId))
                {
                    return BadRequest(new { message = "Unit does not exist or is not available for tenant assignment" });
                }

                // Update old unit status back to "Available"
                var oldUnit = await _context.Units.FindAsync(tenant.UnitId);
                if (oldUnit != null)
                {
                    oldUnit.Status = "Available";
                    _context.Units.Update(oldUnit);
                }

                // Update new unit status to "Rented"
                var newUnit = await _context.Units.FindAsync(dto.UnitId);
                if (newUnit != null)
                {
                    newUnit.Status = "Rented";
                    _context.Units.Update(newUnit);
                }
            }

            // Update tenant properties
            tenant.UnitId = dto.UnitId;
            tenant.UnitNumber = dto.UnitNumber.Trim();
            tenant.FirstName = dto.FirstName.Trim();
            tenant.LastName = dto.LastName.Trim();
            tenant.PhoneNumber = dto.PhoneNumber.Trim();
            tenant.Email = dto.Email.Trim().ToLower();
            tenant.UpdatedAt = DateTime.UtcNow; 

            _context.Tenants.Update(tenant);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Log the exception
                Console.WriteLine($"Database error updating tenant: {ex.Message}");
                
                // Check for specific database constraint violations
                if (ex.InnerException?.Message.Contains("UNIQUE") == true)
                {
                    return BadRequest(new { message = "Email address is already in use by another tenant" });
                }
                
                return BadRequest(new { message = "Failed to update tenant due to database constraint violation" });
            }
            catch (Exception ex)
            {
                // Log it for your server console
                Console.WriteLine($"Unexpected error updating tenant: {ex.Message}");

                // return it in API response
                return BadRequest(new { message = "An unexpected error occurred while updating the tenant" });
            }

            dto.CreatedAt = tenant.CreatedAt;
            dto.UpdatedAt = tenant.UpdatedAt;
            return Ok(dto);
        }

        // DELETE: api/tenants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(int id)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound();
            }

            // Check for related records that would prevent deletion
            var hasPayments = await _context.Payments.AnyAsync(p => p.TenantId == id);
            var hasMaintenanceRequests = await _context.MaintenanceRequests.AnyAsync(m => m.TenantId == id);
            var hasLeases = await _context.Leases.AnyAsync(l => l.TenantId == id);

            if (hasPayments || hasMaintenanceRequests || hasLeases)
            {
                return BadRequest(new { message = "Cannot delete tenant with existing payments, maintenance requests, or leases. Please edit the tenant's email instead." });
            }

            // Update unit status back to "Available"
            var unit = await _context.Units.FindAsync(tenant.UnitId);
            if (unit != null)
            {
                unit.Status = "Available";
                _context.Units.Update(unit);
            }

            _context.Tenants.Remove(tenant);

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