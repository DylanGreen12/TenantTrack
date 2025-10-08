using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceRequestFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "MaintenanceRequests");

            migrationBuilder.RenameColumn(
                name: "TimeScheduled",
                table: "MaintenanceRequests",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "TimeCreated",
                table: "MaintenanceRequests",
                newName: "RequestedAt");

            migrationBuilder.RenameColumn(
                name: "PropertyId",
                table: "MaintenanceRequests",
                newName: "TenantId");

            migrationBuilder.AddColumn<int>(
                name: "AssignedTo",
                table: "MaintenanceRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CompletedAt",
                table: "MaintenanceRequests",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "MaintenanceRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRequests_TenantId",
                table: "MaintenanceRequests",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceRequests_Tenants_TenantId",
                table: "MaintenanceRequests",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceRequests_Tenants_TenantId",
                table: "MaintenanceRequests");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceRequests_TenantId",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "AssignedTo",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "MaintenanceRequests");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "MaintenanceRequests",
                newName: "TimeScheduled");

            migrationBuilder.RenameColumn(
                name: "TenantId",
                table: "MaintenanceRequests",
                newName: "PropertyId");

            migrationBuilder.RenameColumn(
                name: "RequestedAt",
                table: "MaintenanceRequests",
                newName: "TimeCreated");

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "MaintenanceRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
