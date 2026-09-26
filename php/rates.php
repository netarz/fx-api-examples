<?php

/**
 * NetArz FX API with plain PHP cURL: file cache + "last good value" fallback.
 * Fits shared hosting (only ext-curl and a writable directory needed).
 *
 * NETARZ_FX_KEY=fx-ntz-v1-... php rates.php
 *
 * Your server's outgoing IP must be allow-listed on the app in https://netarz.ir/fx
 * Docs: https://netarz.ir/docs/fx/rates
 */

declare(strict_types=1);

function netarz_fx(string $path, array $query = [], int $ttl = 180): array
{
    $key = getenv('NETARZ_FX_KEY') ?: throw new RuntimeException('Set NETARZ_FX_KEY first.');
    $url = 'https://netarz.ir/api/fx/v1'.$path.($query ? '?'.http_build_query($query) : '');
    $cacheFile = sys_get_temp_dir().'/netarz-fx-'.md5($url).'.json';

    // Fresh cache: no request at all.
    if (is_file($cacheFile) && time() - filemtime($cacheFile) < $ttl) {
        return json_decode((string) file_get_contents($cacheFile), true);
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        // The IP NetArz sees must match your allow-list; IPv4 keeps it stable.
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer '.$key, 'Accept: application/json'],
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    $body = is_string($raw) ? json_decode($raw, true) : null;

    if ($status === 200 && is_array($body)) {
        file_put_contents($cacheFile, $raw, LOCK_EX);

        return $body;
    }

    // API or network failed: serve the last good copy, however old, rather than nothing.
    if (is_file($cacheFile)) {
        return json_decode((string) file_get_contents($cacheFile), true);
    }

    $error = $body['error'] ?? ['code' => 'network_error', 'message' => 'no response'];
    $hint = isset($error['ip']) ? " (add IP {$error['ip']} in the panel)" : '';

    throw new RuntimeException("{$error['code']}: {$error['message']}{$hint}");
}

$board = netarz_fx('/rates', ['codes' => 'USD,EUR,AED']);

foreach ($board['data'] as $row) {
    printf("%s  buy %s  sell %s  (per %d)\n", $row['code'], number_format($row['buy']), number_format($row['sell']), $row['unit']);
}

$usd = netarz_fx('/convert', ['from' => 'USD', 'to' => 'IRT', 'amount' => 250]);
echo '250 USD = ', number_format($usd['data']['result']), " Toman\n";
