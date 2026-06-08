using Attendance.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Attendance.Infrastructure.Persistence;

/// <summary>
/// Replaces the placeholder password hash created by 03_seed_manager.sql
/// with a real PBKDF2 hash produced by the application's password hasher.
/// Idempotent: only acts while the stored hash is still the placeholder.
/// </summary>
public static class DbSeeder
{
    public const string PlaceholderHash = "__REPLACE_WITH_REAL_HASH__";
    public const string SeedManagerEmail = "admin@attendance.local";
    public const string DefaultManagerPassword = "Admin#12345"; // dev only - change after first login

    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(DbSeeder));

        var manager = await db.Users
            .FirstOrDefaultAsync(u => u.Email == SeedManagerEmail, ct);

        if (manager is null)
        {
            logger.LogWarning("Seed manager {Email} not found. Run 03_seed_manager.sql first.", SeedManagerEmail);
            return;
        }

        if (manager.PasswordHash == PlaceholderHash)
        {
            manager.PasswordHash = hasher.Hash(DefaultManagerPassword);
            await db.SaveChangesAsync(ct);
            logger.LogWarning(
                "Seed manager password initialized to the default dev password. CHANGE IT after first login.");
        }
    }
}
