namespace Attendance.Application.Dtos.Attendance;

public class AttendanceRecordDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly WorkDate { get; set; }
    public string Status { get; set; } = null!;

    public DateTime ClockInTime { get; set; }
    public DateTime? ClockOutTime { get; set; }
    public decimal ExpectedDailyHoursSnapshot { get; set; }

    // Basic derived figures (computed from raw times, never stored).
    public int WorkedMinutes { get; set; }
    public int BreakMinutes { get; set; }

    // Full-precision seconds for the live timer (floor, no rounding).
    public int WorkedSeconds { get; set; }
    public int BreakSeconds { get; set; }

    // Current break state.
    public bool HasActiveBreak { get; set; }
    public DateTime? ActiveBreakStartTime { get; set; }

    public List<BreakDto> Breaks { get; set; } = new();
}
