namespace Selu383.SP25.P03.Api.Features.Units
{
    public class UnitDto
    {
        public int Id { get; set; }
        public string UnitNumber { get; set; }
        public int PropertyId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal SquareFeet { get; set; }
        public decimal Rent { get; set; }
        public string Status { get; set; }
    }

    public class BulkUnitCreateDto
    {
        public required List<string> UnitNumbers { get; set; }
        public int PropertyId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal SquareFeet { get; set; }
        public decimal Rent { get; set; }
        public string? Status { get; set; }
    }
}