using Attendance.Application.Interfaces;
using Attendance.Infrastructure.Persistence;
using Attendance.Infrastructure.Security;
using Attendance.Infrastructure.Time;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Attendance.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AttendanceDb");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Expose the context through the Application abstraction.
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Time abstractions:
        //  - ITimeProvider (system clock) for infrastructure concerns (JWT, reports, audit).
        //  - IExternalTimeProvider (Europe/Zurich via TimeAPI.io) for attendance punches.
        services.AddSingleton<ITimeProvider, SystemTimeProvider>();

        var timeApiBaseUrl = configuration["ExternalTime:BaseUrl"] ?? "https://timeapi.io/";
        var timeApiTimeoutSeconds = int.TryParse(configuration["ExternalTime:TimeoutSeconds"], out var t) ? t : 5;
        services.AddHttpClient(ExternalZurichTimeProvider.HttpClientName, client =>
        {
            client.BaseAddress = new Uri(timeApiBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(timeApiTimeoutSeconds);
        });
        services.AddSingleton<IExternalTimeProvider, ExternalZurichTimeProvider>();

        // Security
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
