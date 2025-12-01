using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP25.P03.Api.Migrations
{
    /// <inheritdoc />
    public partial class mergeemail1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF OBJECT_ID('PendingChangeRequests', 'U') IS NULL
                BEGIN
                    CREATE TABLE [PendingChangeRequests] (
                        [Id] int NOT NULL IDENTITY,
                        [UserId] int NOT NULL,
                        [Token] nvarchar(450) NOT NULL,
                        [ChangeType] nvarchar(max) NOT NULL,
                        [NewEmail] nvarchar(max) NULL,
                        [NewPassword] nvarchar(max) NULL,
                        [ExpiresAt] datetime2 NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_PendingChangeRequests] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_PendingChangeRequests_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                    );
                    
                    CREATE UNIQUE INDEX [IX_PendingChangeRequests_Token] ON [PendingChangeRequests] ([Token]);
                    CREATE INDEX [IX_PendingChangeRequests_ExpiresAt] ON [PendingChangeRequests] ([ExpiresAt]);
                    CREATE INDEX [IX_PendingChangeRequests_UserId] ON [PendingChangeRequests] ([UserId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF OBJECT_ID('PendingChangeRequests', 'U') IS NOT NULL
                BEGIN
                    DROP TABLE [PendingChangeRequests];
                END
            ");
        }
    }
}