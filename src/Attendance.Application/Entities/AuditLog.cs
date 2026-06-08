using Attendance.Application.Enums;

namespace Attendance.Application.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public string EntityType { get; set; } = null!;
    public int EntityId { get; set; }
    public AuditAction Action { get; set; }
    public int PerformedByUserId { get; set; }
    public string? OldValueJson { get; set; }
    public string? NewValueJson { get; set; }
    public string? Note { get; set; }
    public DateTime Timestamp { get; set; }

    // Navigation
    public User PerformedBy { get; set; } = null!;
}
