namespace Selu383.SP25.P03.Api.Features.Leases
{
    public class LeaseDto
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public date StartDate { get; set; }
        public date EndDate { get; set; }
        public decimal Rent { get; set; }
        public decimal Deposit { get; set; }
        public string Status { get; set; } 
    }
}