namespace Attendance.Application.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);

    /// <summary>Returns true if the plaintext password matches the stored hash.</summary>
    bool Verify(string hash, string password);
}
