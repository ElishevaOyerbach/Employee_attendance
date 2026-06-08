using Attendance.Application.Dtos.Auth;
using Attendance.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        // Same response for "no user", "wrong password" and "inactive"
        // to avoid leaking which accounts exist.
        if (user is null || !user.IsActive)
            return null;

        if (!_passwordHasher.Verify(user.PasswordHash, request.Password))
            return null;

        var token = _tokenGenerator.Generate(user);

        return new LoginResponse
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAt,
            UserId = user.Id,
            FullName = user.FullName,
            Role = user.Role.ToString()
        };
    }
}
