using Attendance.Application.Enums;

namespace Attendance.Application.Entities;

public class Break
{
    public int Id { get; set; }
    public int AttendanceRecordId { get; set; }
    public DateTime BreakStartTime { get; set; }
    public DateTime? BreakEndTime { get; set; }
    public BreakStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public AttendanceRecord AttendanceRecord { get; set; } = null!;
}
