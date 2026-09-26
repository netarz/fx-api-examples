<?php

/**
 * fx-relay.php: a tiny relay on ONE server with a fixed IP.
 *
 * Why: server-side calls to the NetArz FX API are checked against the app's
 * allowed IPs. Google Sheets, Excel on a laptop, Cloudflare Workers, Vercel /
 * Netlify functions and many shared hosts have no fixed outgoing IP. Put this
 * file on a server that does, allow-list that server's IP once, and point the
 * rest at the relay.
 *
 * - Holds the NetArz key; callers only know a relay token you choose.
 * - Caches each answer, so a spreadsheet refreshing often does not burn quota.
 * - Answers JSON, or CSV with ?format=csv (for IMPORTDATA / Power Query).
 * - Exposes only GET /rates and /convert. Do not turn it into an open proxy.
 *
 * Setup (environment variables, or edit the defaults below):
 *   NETARZ_FX_KEY=fx-ntz-v1-...     the app key
 *   FX_RELAY_TOKEN=long-random-string   required from callers as ?token=
 *
 * Call:
 *   https://your-server.example/fx-relay.php?token=...&codes=USD,EUR
 *   https://your-server.example/fx-relay.php?token=...&codes=USD,EUR&format=csv
 *   https://your-server.example/fx-relay.php?token=...&convert=1&from=USD&to=IRT&amount=100
 */

declare(strict_types=1);

const RELAY_CACHE_SECONDS = 180;

$apiKey = getenv('NETARZ_FX_KEY') ?: '';
$token = getenv('FX_RELAY_TOKEN') ?: '';

header('Cache-Control: no-store');

if ($apiKey === '' || strlen($token) < 24) {
    http_response_code(500);
    exit('Relay is not configured: set NETARZ_FX_KEY and a FX_RELAY_TOKEN of 24+ characters.');
}

if (! hash_equals($token, (string) ($_GET['token'] ?? ''))) {
    http_response_code(403);
    exit('forbidden');
}

if (! empty($_GET['convert'])) {
    $side = (string) ($_GET['side'] ?? 'mid');
    $path = '/convert';
    $query = [
        'from' => strtoupper(substr((string) ($_GET['from'] ?? 'USD'), 0, 5)),
        'to' => strtoupper(substr((string) ($_GET['to'] ?? 'IRT'), 0, 5)),
        'amount' => (float) ($_GET['amount'] ?? 1),
        'side' => in_array($side, ['mid', 'buy', 'sell'], true) ? $side : 'mid',
    ];
} else {
    $codes = preg_replace('/[^A-Z,]/', '', strtoupper((string) ($_GET['codes'] ?? 'USD')));
    $path = '/rates';
    $query = ['codes' => substr($codes, 0, 200)];
}

$url = 'https://netarz.ir/api/fx/v1'.$path.'?'.http_build_query($query);
$cacheFile = sys_get_temp_dir().'/fx-relay-'.md5($url).'.json';

$raw = null;
if (is_file($cacheFile) && time() - filemtime($cacheFile) < RELAY_CACHE_SECONDS) {
    $raw = file_get_contents($cacheFile);
} else {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer '.$apiKey, 'Accept: application/json'],
    ]);
    $fresh = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status === 200 && is_string($fresh)) {
        file_put_contents($cacheFile, $fresh, LOCK_EX);
        $raw = $fresh;
    } elseif (is_file($cacheFile)) {
        $raw = file_get_contents($cacheFile); // stale beats nothing
    } else {
        http_response_code($status >= 400 ? $status : 502);
        header('Content-Type: application/json; charset=utf-8');
        exit(is_string($fresh) && $fresh !== '' ? $fresh : '{"error":{"code":"relay_upstream_failed"}}');
    }
}

if (($_GET['format'] ?? 'json') !== 'csv') {
    header('Content-Type: application/json; charset=utf-8');
    exit($raw);
}

$body = json_decode((string) $raw, true);
header('Content-Type: text/csv; charset=utf-8');
$out = fopen('php://output', 'w');

if ($path === '/convert') {
    fputcsv($out, ['from', 'to', 'amount', 'side', 'rate', 'result', 'as_of']);
    $d = $body['data'];
    fputcsv($out, [$d['from'], $d['to'], $d['amount'], $d['side'], $d['rate'], $d['result'], $body['meta']['as_of'] ?? '']);
} else {
    fputcsv($out, ['code', 'name_en', 'unit', 'buy', 'sell', 'mid', 'change_24h_percent', 'as_of']);
    foreach ($body['data'] as $r) {
        fputcsv($out, [$r['code'], $r['name_en'], $r['unit'], $r['buy'], $r['sell'], $r['mid'], $r['change_24h_percent'], $body['meta']['as_of'] ?? '']);
    }
}
fclose($out);
