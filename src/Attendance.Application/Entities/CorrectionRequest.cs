using Attendance.Application.Enums;

namespace Attendance.Application.Entities;

public class CorrectionRequest
{
    public int Id { get; set; }
    public int AttendanceRecordId { get; set; }
    public int? BreakId { get; set; }
    public CorrectionRequestType RequestType { get; set; }
    public CorrectionTargetField TargetField { get; set; }
    public DateTime? OriginalTime { get; set; }
    public DateTime RequestedTime { get; set; }
    public DateTime? ApprovedTime { get; set; }
    public CorrectionStatus Status { get; set; }
    public string? EmployeeNote { get; set; }
    public string? ManagerNote { get; set; }
    public int RequestedByUserId { get; set; }
    public int? ReviewedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Navigation
    public AttendanceRecord AttendanceRecord { get; set; } = null!;
    public Break? Break { get; set; }
    public User RequestedBy { get; set; } = null!;
    public User? ReviewedBy { get; set; }
}
