namespace Attendance.Application.Dtos.Reports;

public class AttendanceReportRow
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public DateOnly WorkDate { get; set; }
    public DateTime ClockInTime { get; set; }
    public DateTime? ClockOutTime { get; set; }
    public int WorkedMinutes { get; set; }
    public int BreakMinutes { get; set; }
    public string Status { get; set; } = null!;
}
