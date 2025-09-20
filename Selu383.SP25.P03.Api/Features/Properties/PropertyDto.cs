namespace Selu383.SP25.P03.Api.Features.Properties
{
    public class PropertyDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string? ImageUrl { get; set; }
        public int UserId { get; set; }
    }
}