using Attendance.Application.Dtos.Users;
using Attendance.Application.Entities;

namespace Attendance.Application.Mapping;

public static class UserMappings
{
    public static UserResponse ToResponse(this User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role.ToString(),
        ExpectedDailyHours = user.ExpectedDailyHours,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt
    };
}
