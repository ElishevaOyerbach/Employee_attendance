using Attendance.Application.Interfaces;
using Attendance.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Attendance.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<ICorrectionService, CorrectionService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
