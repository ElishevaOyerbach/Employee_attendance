namespace Attendance.Application.Common.Exceptions;

/// <summary>
/// The external time source (Europe/Zurich) could not be reached or returned an
/// invalid response. Attendance punches fail closed when this happens.
/// </summary>
public sealed class ExternalTimeUnavailableException : AppException
{
    public override int StatusCode => 503;
    public override string Title => "Time service unavailable";

    public ExternalTimeUnavailableException(string message) : base(message)
    {
    }
}
