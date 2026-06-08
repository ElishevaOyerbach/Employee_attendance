namespace Attendance.Application.Dtos.Reports;

public class DailySummaryResponse
{
    public DateOnly Date { get; set; }
    public int WorkedMinutes { get; set; }
    public int BreakMinutes { get; set; }
    public int ExpectedMinutes { get; set; }

    /// <summary>Worked beyond the day's expected quota.</summary>
    public int OvertimeMinutes { get; set; }

    /// <summary>Quota not met for the day.</summary>
    public int MissingMinutes { get; set; }
}
