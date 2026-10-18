using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

// Backend-only, standard-library example; no Jupiter cookies/modules or durable queue.
public sealed class ObservabilityClient : IDisposable
{
    private readonly HttpClient http = new(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = Timeout.InfiniteTimeSpan };
    private readonly Uri endpoint;
    private readonly string token;
    public ObservabilityClient(string endpoint, string token)
    {
        var uri = new Uri(endpoint, UriKind.Absolute);
        var localHttp = uri.Scheme == "http" && (uri.Host is "localhost" or "127.0.0.1" or "[::1]") && Environment.GetEnvironmentVariable("OBSERVABILITY_ALLOW_LOCAL_HTTP") == "1";
        if (uri.UserInfo.Length != 0 || uri.Query.Length != 0 || uri.Fragment.Length != 0 || uri.Scheme != "https" && !localHttp || token.Length < 32) throw new ArgumentException("INVALID_CONFIGURATION");
        this.endpoint = new Uri(endpoint.TrimEnd('/') + "/events/batch"); this.token = token;
    }
    public async Task<Dictionary<string, int>> SendBatch(IReadOnlyList<JsonObject> events)
    {
        if (events.Count is < 1 or > 50) throw new ArgumentException("INVALID_BATCH");
        var pending = events.ToDictionary(e => e["eventId"]!.GetValue<string>(), e => e.DeepClone().AsObject());
        var counts = new Dictionary<string, int> { ["ACCEPTED"] = 0, ["DUPLICATE"] = 0, ["REJECTED"] = 0 };
        TimeSpan delay = TimeSpan.Zero;
        for (var attempt = 0; attempt < 5 && pending.Count > 0; attempt++)
        {
            if (delay > TimeSpan.Zero) await Task.Delay(delay);
            var body = JsonSerializer.Serialize(new { events = pending.Values.ToArray() });
            if (Encoding.UTF8.GetByteCount(body) > 524288 || pending.Values.Any(e => Encoding.UTF8.GetByteCount(e.ToJsonString()) > 16384)) throw new ArgumentException("PAYLOAD_TOO_LARGE");
            delay = TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, attempt) + Random.Shared.NextDouble()));
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            try
            {
                using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode != HttpStatusCode.TooManyRequests && (int)response.StatusCode < 500) throw new InvalidOperationException("INGESTION_REJECTED");
                    var retry = response.Headers.RetryAfter;
                    var seconds = retry?.Delta?.TotalSeconds ?? (retry?.Date - DateTimeOffset.UtcNow)?.TotalSeconds;
                    if (seconds.HasValue) delay = TimeSpan.FromSeconds(Math.Clamp(seconds.Value, 0, 30));
                    continue;
                }
                await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
                using var bytes = new MemoryStream(); var buffer = new byte[16384]; int read;
                while ((read = await stream.ReadAsync(buffer, timeout.Token)) > 0)
                {
                    if (bytes.Length + read > 262144) throw new InvalidOperationException("RESPONSE_TOO_LARGE");
                    bytes.Write(buffer, 0, read);
                }
                using var result = JsonDocument.Parse(bytes.ToArray()); var root = result.RootElement;
                if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("schemaVersion", out var version) || version.ValueKind != JsonValueKind.String || version.GetString() != "1.1" || !root.TryGetProperty("acknowledgements", out var ack) || ack.ValueKind != JsonValueKind.Array) continue;
                var seen = new HashSet<string>(); var rows = new List<(string Id, string Status)>(); var valid = true;
                foreach (var row in ack.EnumerateArray())
                {
                    if (row.ValueKind != JsonValueKind.Object || !row.TryGetProperty("eventId", out var idNode) || idNode.ValueKind != JsonValueKind.String || !row.TryGetProperty("status", out var statusNode) || statusNode.ValueKind != JsonValueKind.String) { valid = false; break; }
                    var id = idNode.GetString()!; var status = statusNode.GetString()!;
                    if (!pending.ContainsKey(id) || !seen.Add(id) || !counts.ContainsKey(status) && status != "RETRYABLE") { valid = false; break; }
                    rows.Add((id, status));
                }
                if (!valid) continue;
                foreach (var row in rows.Where(r => r.Status != "RETRYABLE")) { counts[row.Status]++; pending.Remove(row.Id); }
            }
            catch (Exception error) when (error is HttpRequestException or OperationCanceledException or JsonException or IOException) { /* Same IDs/payload snapshot, bounded retry. Never log raw bodies. */ }
        }
        if (pending.Count > 0) throw new InvalidOperationException("RETRY_EXHAUSTED");
        return counts;
    }
    public void Dispose() => http.Dispose();
}

internal static class Program
{
    private static string Required(string key) => Environment.GetEnvironmentVariable(key) ?? throw new ArgumentException("MISSING_CONFIGURATION");
    public static async Task<int> Main()
    {
        try
        {
            using var client = new ObservabilityClient(Required("OBSERVABILITY_ENDPOINT"), Required("OBSERVABILITY_SERVER_CREDENTIAL"));
            var sample = new JsonObject { ["eventId"] = Guid.NewGuid().ToString(), ["schemaVersion"] = "1.1", ["applicationId"] = Guid.Parse(Required("OBSERVABILITY_APPLICATION_ID")).ToString(), ["environmentId"] = Guid.Parse(Required("OBSERVABILITY_ENVIRONMENT_ID")).ToString(), ["occurredAt"] = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture), ["source"] = "REFERENCE_CLIENT", ["category"] = "BACKEND", ["severity"] = "ERROR", ["eventCode"] = "reference.csharp", ["normalizedMessage"] = "Controlled CSharp reference operation" };
            var output = new Dictionary<string, Dictionary<string, int>> { ["first"] = await client.SendBatch([sample]) };
            if (Environment.GetEnvironmentVariable("OBSERVABILITY_VERIFY_REPLAY") == "1") output["replay"] = await client.SendBatch([sample]);
            Console.WriteLine(JsonSerializer.Serialize(output)); return output.Values.Any(row => row["REJECTED"] > 0) ? 1 : 0;
        }
        catch { Console.Error.WriteLine("REFERENCE_CLIENT_FAILED"); return 1; }
    }
}
