namespace Selu383.SP25.P03.Api.Features.Leases
{
    public class LeaseDto
    {
        public int Id { get; set; }
        public required string UnitNumber { get; set; }
        public required int TenantId { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required DateOnly StartDate { get; set; }
        public required DateOnly EndDate { get; set; }
        public required decimal Rent { get; set; }
        public required decimal Deposit { get; set; }
        public required string Status { get; set; } // Pending, Active, Expired, Terminated, Denied
    }
}