namespace Selu383.SP25.P03.Test.Dtos;

internal class UserDto : PasswordGuard
{
    public int Id { get; set; }
    public string? UserName { get; set; }
    public string[]? Roles { get; set; }
}