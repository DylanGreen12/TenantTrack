using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMaintenanceRequestsToProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RoomId",
                table: "MaintenanceRequests");

            migrationBuilder.RenameColumn(
                name: "TypeId",
                table: "MaintenanceRequests",
                newName: "PropertyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PropertyId",
                table: "MaintenanceRequests",
                newName: "TypeId");

            migrationBuilder.AddColumn<int>(
                name: "RoomId",
                table: "MaintenanceRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
