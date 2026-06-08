namespace Attendance.Application.Dtos.Attendance;

public class BreakDto
{
    public int Id { get; set; }
    public DateTime BreakStartTime { get; set; }
    public DateTime? BreakEndTime { get; set; }
    public string Status { get; set; } = null!;

    /// <summary>Minutes from start to end (or to "now" while still open).</summary>
    public int DurationMinutes { get; set; }

    /// <summary>Full-precision seconds for the live timer (floor, no rounding).</summary>
    public int DurationSeconds { get; set; }
}
