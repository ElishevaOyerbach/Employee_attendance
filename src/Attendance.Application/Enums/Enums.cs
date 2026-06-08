namespace Attendance.Application.Enums;

// Numeric values MUST stay in sync with the TINYINT + CHECK constraints in the DB.

public enum UserRole : byte
{
    Employee = 0,
    Manager = 1
}

public enum AttendanceStatus : byte
{
    Active = 0,
    Completed = 1,
    PendingReview = 2
}

public enum BreakStatus : byte
{
    Active = 0,
    Completed = 1,
    PendingReview = 2
}

public enum CorrectionRequestType : byte
{
    MissingAction = 0,
    TimeAdjustment = 1
}

public enum CorrectionTargetField : byte
{
    ClockIn = 0,
    ClockOut = 1,
    BreakStart = 2,
    BreakEnd = 3
}

public enum CorrectionStatus : byte
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum AuditAction : byte
{
    DirectEdit = 0,
    CorrectionApproved = 1,
    CorrectionRejected = 2,
    UserDeactivated = 3,
    UserCreated = 4,
    ShiftAutoFlagged = 5
}
