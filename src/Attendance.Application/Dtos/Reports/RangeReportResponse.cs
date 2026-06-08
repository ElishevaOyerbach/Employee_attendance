namespace Attendance.Application.Dtos.Reports;

public class RangeReportResponse
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int TotalWorkedMinutes { get; set; }
    public int TotalBreakMinutes { get; set; }

    /// <summary>Distinct calendar days with at least one Completed shift.</summary>
    public int DaysWorked { get; set; }

    /// <summary>Active + PendingReview shifts in the range.</summary>
    public int OpenShiftsCount { get; set; }

    public List<AttendanceReportRow> Rows { get; set; } = new();
}
