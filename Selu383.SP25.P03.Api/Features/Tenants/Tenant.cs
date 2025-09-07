using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Units;

namespace Selu383.SP25.P03.Api.Features.Tenants
{
    public class Tenant
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public int Unit { get; set; }

        [ForeignKey("UnitId")]
        [Required]
        [MaxLength(120)]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public timestamp CreatedAt { get; set; } 

        public timestamp UpdatedAt { get; set; } 
        
        public virtual Unit Unit { get; set; } 
    }
}