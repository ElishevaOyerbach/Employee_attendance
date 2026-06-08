using System.Security.Claims;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;

namespace Attendance.Api.Security;

/// <summary>
/// Reads the authenticated caller from the current HTTP request's claims.
/// </summary>
public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public int UserId
    {
        get
        {
            var value = Principal?.FindFirstValue("sub")
                ?? Principal?.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(value, out var id)
                ? id
                : throw new InvalidOperationException("No authenticated user id in the current context.");
        }
    }

    public UserRole Role =>
        Enum.TryParse<UserRole>(Principal?.FindFirstValue(ClaimTypes.Role), out var role)
            ? role
            : throw new InvalidOperationException("No authenticated user role in the current context.");

    public bool IsManager => Role == UserRole.Manager;
}
