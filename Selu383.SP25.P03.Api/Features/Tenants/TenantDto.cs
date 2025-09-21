namespace Selu383.SP25.P03.Api.Features.Tenants
{
    public class TenantDto
    {
        public int Id { get; set; }
        public required int UnitId { get; set; }
        public required string UnitNumber { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Email { get; set; }
        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; } 
    }
}