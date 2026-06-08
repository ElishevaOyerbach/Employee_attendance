namespace Attendance.Application.Interfaces;

/// <summary>
/// Single source of "current time" for the whole system.
/// MVP uses the system clock; later this can be swapped for an
/// external Europe/Zurich time source WITHOUT touching any service.
/// Never call DateTime.Now directly anywhere else.
/// </summary>
public interface ITimeProvider
{
    DateTime Now { get; }
    DateTime UtcNow { get; }
    DateOnly Today { get; }
}
