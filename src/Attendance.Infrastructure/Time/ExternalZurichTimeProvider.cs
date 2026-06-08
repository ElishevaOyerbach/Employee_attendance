using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Attendance.Application.Common.Exceptions;
using Attendance.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Attendance.Infrastructure.Time;

/// <summary>
/// Provides the authoritative current time from TimeAPI.io for Europe/Zurich.
/// Fails closed: any network/parse error throws ExternalTimeUnavailableException
/// and never falls back to the local clock.
/// </summary>
public sealed class ExternalZurichTimeProvider : IExternalTimeProvider
{
    public const string HttpClientName = "TimeApi";
    private const string RequestUri = "api/Time/current/zone?timeZone=Europe/Zurich";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExternalZurichTimeProvider> _logger;

    public ExternalZurichTimeProvider(IHttpClientFactory httpClientFactory, ILogger<ExternalZurichTimeProvider> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<DateTimeOffset> GetCurrentTimeAsync(CancellationToken ct = default)
    {
        var client = _httpClientFactory.CreateClient(HttpClientName);

        TimeApiResponse? payload;
        try
        {
            payload = await client.GetFromJsonAsync<TimeApiResponse>(RequestUri, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogError(ex, "ExternalZurichTimeProvider failed to reach TimeAPI.io");
            throw new ExternalTimeUnavailableException(
                "Could not obtain the current time from the external time service (Europe/Zurich). The action was not recorded. Please try again.");
        }

        if (payload is null || string.IsNullOrWhiteSpace(payload.DateTime))
        {
            _logger.LogError("ExternalZurichTimeProvider received an empty/invalid response from TimeAPI.io");
            throw new ExternalTimeUnavailableException(
                "The external time service returned an invalid response. The action was not recorded. Please try again.");
        }

        var localZurich = System.DateTime.Parse(payload.DateTime, CultureInfo.InvariantCulture, DateTimeStyles.None);
        // Zurich is CEST (+02:00) during DST, CET (+01:00) otherwise.
        var offset = TimeSpan.FromHours(payload.DstActive ? 2 : 1);
        var result = new DateTimeOffset(localZurich, offset);

        _logger.LogInformation(
            "ExternalZurichTimeProvider obtained {ZurichTime} (DST={DstActive}) from TimeAPI.io",
            result, payload.DstActive);

        return result;
    }

    private sealed class TimeApiResponse
    {
        [JsonPropertyName("dateTime")]
        public string? DateTime { get; set; }

        [JsonPropertyName("dstActive")]
        public bool DstActive { get; set; }
    }
}
