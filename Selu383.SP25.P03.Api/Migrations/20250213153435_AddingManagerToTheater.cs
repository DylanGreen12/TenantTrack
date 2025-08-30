using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddingManagerToTheater : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ManagerId",
                table: "Theaters",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Theaters_ManagerId",
                table: "Theaters",
                column: "ManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Theaters_AspNetUsers_ManagerId",
                table: "Theaters",
                column: "ManagerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Theaters_AspNetUsers_ManagerId",
                table: "Theaters");

            migrationBuilder.DropIndex(
                name: "IX_Theaters_ManagerId",
                table: "Theaters");

            migrationBuilder.DropColumn(
                name: "ManagerId",
                table: "Theaters");
        }
    }
}
