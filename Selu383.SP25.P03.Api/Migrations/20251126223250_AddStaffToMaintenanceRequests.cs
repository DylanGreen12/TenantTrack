using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffToMaintenanceRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AssignedTo",
                table: "MaintenanceRequests",
                newName: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequests_StaffId",
                table: "MaintenanceRequests",
                column: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Staff_StaffId",
                table: "MaintenanceRequests",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Staff_StaffId",
                table: "MaintenanceRequests");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRequests_StaffId",
                table: "MaintenanceRequests");

            migrationBuilder.RenameColumn(
                name: "StaffId",
                table: "MaintenanceRequests",
                newName: "AssignedTo");
        }
    }
}
