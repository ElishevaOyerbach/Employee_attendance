using Attendance.Application.Enums;

namespace Attendance.Application.Interfaces;

/// <summary>
/// The authenticated caller, derived from the JWT claims.
/// Lets Application services know "who is acting" without touching HttpContext.
/// </summary>
public interface ICurrentUser
{
    int UserId { get; }
    UserRole Role { get; }
    bool IsManager { get; }
}
