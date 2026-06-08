using Attendance.Application.Common.Exceptions;
using Attendance.Application.Dtos.Users;
using Attendance.Application.Entities;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;
using Attendance.Application.Mapping;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Application.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _audit;
    private readonly ICurrentUser _currentUser;
    private readonly ITimeProvider _time;

    public UserService(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IAuditService audit,
        ICurrentUser currentUser,
        ITimeProvider time)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _audit = audit;
        _currentUser = currentUser;
        _time = time;
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim();

        var emailTaken = await _db.Users.AnyAsync(u => u.Email == email, ct);
        if (emailTaken)
            throw new ConflictException($"Email '{email}' is already in use.");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = request.Role,
            ExpectedDailyHours = request.ExpectedDailyHours,
            IsActive = true,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = _time.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct); // assigns Id

        _audit.Log(AuditAction.UserCreated, nameof(User), user.Id, _currentUser.UserId,
            newValues: new { user.FullName, user.Email, Role = user.Role.ToString(), user.ExpectedDailyHours });
        await _db.SaveChangesAsync(ct);

        return user.ToResponse();
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .ToListAsync(ct);

        return users.Select(u => u.ToResponse()).ToList();
    }

    public async Task<UserResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        return user?.ToResponse();
    }

    public async Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw NotFoundException.For(nameof(User), id);

        user.FullName = request.FullName.Trim();
        user.ExpectedDailyHours = request.ExpectedDailyHours;

        await _db.SaveChangesAsync(ct);
        return user.ToResponse();
    }

    public async Task DeactivateAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw NotFoundException.For(nameof(User), id);

        if (!user.IsActive)
            return; // already inactive - idempotent

        var hasActiveShift = await _db.AttendanceRecords
            .AnyAsync(a => a.UserId == id && a.Status == AttendanceStatus.Active, ct);
        if (hasActiveShift)
            throw new ConflictException("Cannot deactivate a user who has an active (open) shift. Close it first.");

        user.IsActive = false;
        _audit.Log(AuditAction.UserDeactivated, nameof(User), user.Id, _currentUser.UserId);

        await _db.SaveChangesAsync(ct);
    }
}
