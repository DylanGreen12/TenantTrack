using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaymentModelForStripe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LeaseId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripePaymentIntentId",
                table: "Payments",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_LeaseId",
                table: "Payments",
                column: "LeaseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Leases_LeaseId",
                table: "Payments",
                column: "LeaseId",
                principalTable: "Leases",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Leases_LeaseId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_LeaseId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "LeaseId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "StripePaymentIntentId",
                table: "Payments");
        }
    }
}
