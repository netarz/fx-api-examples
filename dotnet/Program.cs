// NetArz FX API from C# with HttpClient (.NET 8, no NuGet packages).
//
// Server-side calls carry no Origin header, so this machine's outgoing IP must
// be in the app's "IPهای مجاز" list at https://netarz.ir/fx
//
//   export NETARZ_FX_KEY=fx-ntz-v1-...
//   dotnet run                   # USD, EUR, AED
//   dotnet run -- USD TRY GBP    # any codes, one request
//
// Docs: https://netarz.ir/docs/fx/rates
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json.Serialization;

var key = Environment.GetEnvironmentVariable("NETARZ_FX_KEY");
if (string.IsNullOrWhiteSpace(key))
{
    Console.Error.WriteLine("Set NETARZ_FX_KEY first (create an app at https://netarz.ir/fx).");
    return 2;
}

var codes = args.Length > 0 ? args : new[] { "USD", "EUR", "AED" };
var fx = new NetArz.Fx.NetArzFxClient(key);

try
{
    var board = await fx.RatesAsync(codes);
    foreach (var r in board.Data)
    {
        var change = r.Change24hPercent is { } c ? $"{c:+0.00;-0.00}%" : "-";
        Console.WriteLine($"{r.Code}\tbuy {r.Buy:N0}\tsell {r.Sell:N0}\tper {r.Unit}\t{change}");
    }
    var delay = board.Meta.IsDelayed ? $"delayed {board.Meta.DelayedMinutes} min" : "live";
    Console.WriteLine($"as of {board.Meta.AsOf} ({delay}, plan: {board.Meta.Plan})");
    return 0;
}
catch (NetArz.Fx.NetArzFxException e)
{
    Console.Error.WriteLine(e.Message);
    if (e.SeenIp is not null) Console.Error.WriteLine($"Add this IP in the panel: {e.SeenIp}");
    return 1;
}

namespace NetArz.Fx
{
    public sealed record Rate(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("name_en")] string NameEn,
        [property: JsonPropertyName("unit")] int Unit,
        [property: JsonPropertyName("buy")] decimal Buy,
        [property: JsonPropertyName("sell")] decimal Sell,
        [property: JsonPropertyName("mid")] decimal Mid,
        [property: JsonPropertyName("change_24h_percent")] decimal? Change24hPercent);

    public sealed record RatesMeta(
        [property: JsonPropertyName("as_of")] string AsOf,
        [property: JsonPropertyName("plan")] string Plan,
        [property: JsonPropertyName("is_delayed")] bool IsDelayed,
        [property: JsonPropertyName("delayed_minutes")] int DelayedMinutes);

    public sealed record RatesResponse(
        [property: JsonPropertyName("data")] List<Rate> Data,
        [property: JsonPropertyName("meta")] RatesMeta Meta);

    internal sealed record ErrorBody(
        [property: JsonPropertyName("code")] string? Code,
        [property: JsonPropertyName("message")] string? Message,
        [property: JsonPropertyName("ip")] string? Ip);

    internal sealed record ErrorEnvelope([property: JsonPropertyName("error")] ErrorBody? Error);

    public sealed class NetArzFxException(int status, string? code, string? message, string? seenIp)
        : Exception($"{status} {code}: {message}")
    {
        public int Status { get; } = status;
        public string? Code { get; } = code;
        /// <summary>Present on ip_not_allowed / origin_required: the IP NetArz saw.</summary>
        public string? SeenIp { get; } = seenIp;
    }

    /// <summary>Small FX API client with a short in-memory cache. Reuse one instance.</summary>
    public sealed class NetArzFxClient
    {
        private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(2);
        private readonly HttpClient _http;
        private readonly Dictionary<string, (DateTimeOffset At, RatesResponse Body)> _cache = new();

        public NetArzFxClient(string key)
        {
            var handler = new SocketsHttpHandler
            {
                // Force IPv4 so the source IP is the IPv4 address you allow-listed.
                // Remove ConnectCallback if you allow-listed your server's IPv6 instead.
                ConnectCallback = async (ctx, ct) =>
                {
                    var entry = await Dns.GetHostEntryAsync(ctx.DnsEndPoint.Host, AddressFamily.InterNetwork, ct);
                    var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
                    try
                    {
                        await socket.ConnectAsync(entry.AddressList, ctx.DnsEndPoint.Port, ct);
                        return new NetworkStream(socket, ownsSocket: true);
                    }
                    catch
                    {
                        socket.Dispose();
                        throw;
                    }
                },
            };

            _http = new HttpClient(handler)
            {
                BaseAddress = new Uri("https://netarz.ir/api/fx/v1/"),
                Timeout = TimeSpan.FromSeconds(10),
            };
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
            _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        /// <summary>GET /rates?codes=... : several currencies in one request.</summary>
        public async Task<RatesResponse> RatesAsync(IEnumerable<string> codes, CancellationToken ct = default)
        {
            var path = "rates?codes=" + Uri.EscapeDataString(string.Join(",", codes).ToUpperInvariant());

            lock (_cache)
            {
                if (_cache.TryGetValue(path, out var hit) && DateTimeOffset.UtcNow - hit.At < Ttl) return hit.Body;
            }

            using var res = await _http.GetAsync(path, ct);
            if (!res.IsSuccessStatusCode)
            {
                ErrorEnvelope? err = null;
                try { err = await res.Content.ReadFromJsonAsync<ErrorEnvelope>(cancellationToken: ct); }
                catch (System.Text.Json.JsonException) { /* not JSON: keep the status code */ }
                throw new NetArzFxException((int)res.StatusCode, err?.Error?.Code, err?.Error?.Message, err?.Error?.Ip);
            }

            var body = await res.Content.ReadFromJsonAsync<RatesResponse>(cancellationToken: ct)
                ?? throw new InvalidOperationException("Empty response");

            lock (_cache) _cache[path] = (DateTimeOffset.UtcNow, body);
            return body;
        }
    }
}
