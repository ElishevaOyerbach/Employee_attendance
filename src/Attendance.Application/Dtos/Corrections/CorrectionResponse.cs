namespace Attendance.Application.Dtos.Corrections;

public class CorrectionResponse
{
    public int Id { get; set; }
    public int AttendanceRecordId { get; set; }
    public int? BreakId { get; set; }
    public string RequestType { get; set; } = null!;
    public string TargetField { get; set; } = null!;

    public DateTime? OriginalTime { get; set; }
    public DateTime RequestedTime { get; set; }
    public DateTime? ApprovedTime { get; set; }

    public string Status { get; set; } = null!;
    public string? EmployeeNote { get; set; }
    public string? ManagerNote { get; set; }

    public int RequestedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
