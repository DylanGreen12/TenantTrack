using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Features.Properties
{
    public class Property
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public string Name { get; set; }

        [Required]
        public string Address { get; set; }

        [Required]
        public string City { get; set; }

        [Required]
        [StringLength(2)]
        public string State { get; set; }

        [Required]
        [StringLength(10)]
        public string ZipCode { get; set; }

        [Required]
        public int UserId { get; set; } 
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; } 
    }
}