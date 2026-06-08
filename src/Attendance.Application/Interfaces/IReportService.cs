using Attendance.Application.Dtos.Reports;

namespace Attendance.Application.Interfaces;

public interface IReportService
{
    /// <summary>Monthly summary for the authenticated caller.</summary>
    Task<MonthlySummaryResponse> GetMyMonthlyAsync(int? year, int? month, CancellationToken ct = default);

    /// <summary>Monthly summary for a specific employee (manager only).</summary>
    Task<MonthlySummaryResponse> GetEmployeeMonthlyAsync(int userId, int? year, int? month, CancellationToken ct = default);

    /// <summary>Date-range attendance report for the authenticated caller.</summary>
    Task<RangeReportResponse> GetMyRangeReportAsync(DateOnly from, DateOnly to, CancellationToken ct = default);

    /// <summary>Date-range attendance report for the whole team (manager only). Pass userId to filter to one employee.</summary>
    Task<RangeReportResponse> GetTeamRangeReportAsync(DateOnly from, DateOnly to, int? userId, CancellationToken ct = default);
}
