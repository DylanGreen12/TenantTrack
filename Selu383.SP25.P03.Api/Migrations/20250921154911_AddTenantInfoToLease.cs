using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantInfoToLease : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Leases",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "Leases",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UnitNumber",
                table: "Leases",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Leases");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "Leases");

            migrationBuilder.DropColumn(
                name: "UnitNumber",
                table: "Leases");
        }
    }
}
