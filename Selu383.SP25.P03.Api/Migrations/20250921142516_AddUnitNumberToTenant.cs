using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitNumberToTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Unit",
                table: "Tenants",
                newName: "UnitId");

            migrationBuilder.AddColumn<string>(
                name: "UnitNumber",
                table: "Tenants",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_UnitId",
                table: "Tenants",
                column: "UnitId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_Units_UnitId",
                table: "Tenants",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_Units_UnitId",
                table: "Tenants");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_UnitId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "UnitNumber",
                table: "Tenants");

            migrationBuilder.RenameColumn(
                name: "UnitId",
                table: "Tenants",
                newName: "Unit");
        }
    }
}
