using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
//using Selu383.SP25.P03.Api.Features.Units;

namespace Selu383.SP25.P03.Api.Features.Tenants
{
    public class Tenant
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public required int Unit { get; set; }

        //[ForeignKey("UnitId")]
        [MaxLength(120)]
        public required string FirstName { get; set; }

        public required string LastName { get; set; }

        public required string PhoneNumber { get; set; }

        public required string Email { get; set; }

        public DateTime CreatedAt { get; set; } 

        public DateTime UpdatedAt { get; set; } 
        
        //public virtual Unit Unit { get; set; } 
    }
}