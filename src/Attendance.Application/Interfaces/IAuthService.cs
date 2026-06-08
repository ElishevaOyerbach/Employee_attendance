using Attendance.Application.Dtos.Auth;

namespace Attendance.Application.Interfaces;

public interface IAuthService
{
    /// <summary>
    /// Validates credentials. Returns a LoginResponse on success,
    /// or null if the email/password is wrong or the user is inactive.
    /// </summary>
    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}
