using Attendance.Application.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Attendance.Infrastructure.Security;

/// <summary>
/// Wraps ASP.NET Core Identity's PasswordHasher (PBKDF2) behind our own
/// abstraction. The TUser argument is unused by the default implementation,
/// so a shared dummy instance is fine.
/// </summary>
public sealed class PasswordHasher : IPasswordHasher
{
    private static readonly object _dummyUser = new();
    private readonly PasswordHasher<object> _inner = new();

    public string Hash(string password) =>
        _inner.HashPassword(_dummyUser, password);

    public bool Verify(string hash, string password)
    {
        var result = _inner.VerifyHashedPassword(_dummyUser, hash, password);
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
