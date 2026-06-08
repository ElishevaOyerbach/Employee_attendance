using Attendance.Application.Enums;

namespace Attendance.Application.Entities;

public class AttendanceRecord
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly WorkDate { get; set; }
    public DateTime ClockInTime { get; set; }
    public DateTime? ClockOutTime { get; set; }
    public AttendanceStatus Status { get; set; }
    public decimal ExpectedDailyHoursSnapshot { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<Break> Breaks { get; set; } = new List<Break>();
}
