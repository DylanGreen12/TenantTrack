namespace Selu383.SP25.P03.Api.Features.Staff
{
    public class StaffDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Position { get; set; }
        public int PropertyId { get; set; }
        public int UserId { get; set; }
    }
}