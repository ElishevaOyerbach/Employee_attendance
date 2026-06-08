using Attendance.Application.Entities;

namespace Attendance.Application.Interfaces;

public interface IJwtTokenGenerator
{
    AccessToken Generate(User user);
}

public sealed record AccessToken(string Token, DateTime ExpiresAt);
