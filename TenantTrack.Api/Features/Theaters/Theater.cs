using TenantTrack.Api.Features.Users;
using System.ComponentModel.DataAnnotations;

namespace TenantTrack.Api.Features.Theaters
{
    public class Theater
    {
        public int Id { get; set; }
        [MaxLength(120)]
        public required string Name { get; set; }
        public required string Address { get; set; }
        public int SeatCount { get; set; }
        public int? ManagerId { get; set; }
        public virtual User? Manager { get; set; }
    }
}
