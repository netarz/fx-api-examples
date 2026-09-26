<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * NetArz FX API for Laravel: short cache for freshness, a long-lived
 * "last good" copy for when the API or the network is unavailable.
 *
 * config/services.php:
 *     'netarz_fx' => ['key' => env('NETARZ_FX_KEY')],
 *
 * Usage:
 *     app(NetArzFx::class)->rate('USD')['sell'];   // Toman per 1 USD
 *     app(NetArzFx::class)->toToman(19.99);         // int Toman at the sell rate
 *
 * Docs: https://netarz.ir/docs/fx/sdks
 */
class NetArzFx
{
    private const BASE = 'https://netarz.ir/api/fx/v1';

    private const FRESH_SECONDS = 180;

    /** Board for several currencies in one request. */
    public function board(array $codes = ['USD', 'EUR', 'AED']): array
    {
        $codes = implode(',', array_map('strtoupper', $codes));

        return $this->remember("board:{$codes}", fn () => $this->get('/rates', ['codes' => $codes]));
    }

    /** One currency row: buy, sell, mid (Toman per `unit` units), change_24h_percent, ... */
    public function rate(string $code): array
    {
        $code = strtoupper($code);

        return $this->remember("rate:{$code}", fn () => $this->get("/rates/{$code}"))['data'];
    }

    public function toToman(float $usd, string $side = 'sell'): int
    {
        return (int) round($usd * $this->rate('USD')[$side]);
    }

    private function remember(string $key, callable $fetch): array
    {
        return Cache::remember("netarz-fx:{$key}", self::FRESH_SECONDS, function () use ($key, $fetch) {
            try {
                $body = $fetch();
                Cache::forever("netarz-fx:last-good:{$key}", $body);

                return $body;
            } catch (Throwable $e) {
                // Log the stable code (e.g. ip_not_allowed with the IP NetArz saw) and fall back.
                Log::warning('NetArz FX API failed', ['key' => $key, 'error' => $e->getMessage()]);

                return Cache::get("netarz-fx:last-good:{$key}") ?? throw $e;
            }
        });
    }

    private function get(string $path, array $query = []): array
    {
        $response = Http::withToken((string) config('services.netarz_fx.key'))
            ->acceptJson()
            ->timeout(10)
            // Keep the source IP on IPv4 so it matches the allow-listed address.
            ->withOptions(['force_ip_resolve' => 'v4'])
            ->get(self::BASE.$path, $query);

        if ($response->failed()) {
            $error = $response->json('error') ?? [];

            throw new \RuntimeException(sprintf(
                '%s: %s%s',
                $error['code'] ?? $response->status(),
                $error['message'] ?? 'request failed',
                isset($error['ip']) ? " (seen IP: {$error['ip']})" : '',
            ));
        }

        return $response->json();
    }
}
