namespace Selu383.SP25.P03.Api.Features.Staff
{
    public class StaffDto
    {
        public int Id { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
        public required string Position { get; set; }
        public required int PropertyId { get; set; }
    }
}