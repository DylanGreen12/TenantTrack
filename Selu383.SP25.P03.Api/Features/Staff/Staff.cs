using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Selu383.SP25.P03.Api.Features.Properties;
using Selu383.SP25.P03.Api.Features.Users;

namespace Selu383.SP25.P03.Api.Features.Staff
{
    public class Staff
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public required string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        public required string LastName { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Email { get; set; }

        [MaxLength(15)]
        public required string Phone { get; set; }

        [Required]
        [MaxLength(50)]
        public required string Position { get; set; }

        [Required]
        public required int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        [Required]
        public required int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}