namespace Selu383.SP25.P03.Api.Features.Tenants
{
    public class TenantDto
    {
        public int Id { get; set; }
        public int Unit { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public timestamp CreatedAt { get; set; }

        public timestamp UpdatedAt { get; set; } 
    }
}