using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Properties;

namespace Selu383.SP25.P03.Api.Features.Units
{
    public class Unit
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UnitNumber { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        [Required]
        public int Bedrooms { get; set; }

        [Required]
        public int Bathrooms { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SquareFeet { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Rent { get; set; }

        [Required]
        public string Status { get; set; } = "Available"; // Available, Rented, Maintenance, etc.
    }
}