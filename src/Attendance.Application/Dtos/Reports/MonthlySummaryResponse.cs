namespace Attendance.Application.Dtos.Reports;

public class MonthlySummaryResponse
{
    public int UserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }

    /// <summary>Number of distinct days with at least one completed shift.</summary>
    public int DaysWorked { get; set; }

    public int TotalWorkedMinutes { get; set; }
    public int TotalBreakMinutes { get; set; }
    public int TotalExpectedMinutes { get; set; }
    public int TotalOvertimeMinutes { get; set; }
    public int TotalMissingMinutes { get; set; }

    /// <summary>TotalWorked - TotalExpected (negative = under quota).</summary>
    public int NetDifferenceMinutes { get; set; }

    public List<DailySummaryResponse> Days { get; set; } = new();
}
