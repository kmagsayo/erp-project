<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceivingScanController extends Controller
{
    public function network(Request $request)
    {
        return response()->json([
            'host' => $this->lanIpv4(),
            'port' => $request->getPort() ?: 8080,
        ]);
    }

    public function open(Request $request)
    {
        $code = $this->normalizeCode($request->query('c', $request->query('code')));
        if ($code === null) {
            return response($this->page('This QR is not recognized.', false), 422)
                ->header('Content-Type', 'text/html; charset=UTF-8');
        }

        $exists = DB::table('receiving_scans')->where('code', $code)->exists();
        if (! $exists) {
            DB::table('receiving_scans')->insertOrIgnore([
                'code' => $code,
                'created_at' => now(),
            ]);
        }

        return response($this->page('Item marked received.', true))
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    public function index()
    {
        $codes = DB::table('receiving_scans')
            ->orderBy('id')
            ->limit(20)
            ->pluck('code')
            ->all();

        return ApiResponse::success(['codes' => $codes]);
    }

    public function claim(Request $request)
    {
        $codes = $request->input('codes', []);
        if (! is_array($codes)) {
            return ApiResponse::error('Validation failed.', ['codes' => ['Codes must be a list.']], 422);
        }

        $valid = [];
        foreach ($codes as $code) {
            $normalized = $this->normalizeCode(is_string($code) ? $code : '');
            if ($normalized !== null) {
                $valid[] = $normalized;
            }
        }

        if ($valid !== []) {
            DB::table('receiving_scans')->whereIn('code', $valid)->delete();
        }

        return ApiResponse::success(['claimed' => count($valid)]);
    }

    private function normalizeCode(mixed $code): ?string
    {
        $value = preg_replace('/\s+/', '', (string) $code) ?? '';
        if (! preg_match('/^(?:RCVITEM:[A-Za-z0-9-]+:[A-Za-z0-9-]+|DRITEM:DR-[A-Za-z0-9-]+:[A-Za-z0-9-]+)$/', $value)) {
            return null;
        }

        return $value;
    }

    private function page(string $message, bool $ok): string
    {
        $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        $color = $ok ? '#15803D' : '#9f1239';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$safe}</title>
</head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f6f4f2;color:#1a1614;">
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
    <section style="width:100%;max-width:360px;background:#fff;border-radius:16px;padding:32px 24px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.08);">
      <p style="margin:0;font-size:28px;font-weight:700;color:{$color};">{$safe}</p>
      <p style="margin:12px 0 0;font-size:16px;line-height:1.4;">You can scan the next item.</p>
    </section>
  </main>
</body>
</html>
HTML;
    }

    private function lanIpv4(): ?string
    {
        $lines = [];
        @exec('ipconfig', $lines);
        $adapter = '';
        $candidates = [];

        foreach ($lines as $line) {
            if (preg_match('/adapter (.+):/', $line, $match)) {
                $adapter = $match[1];
                continue;
            }

            if (! preg_match('/IPv4[^:]*:\s*([0-9.]+)/', $line, $match)) {
                continue;
            }

            $ip = $match[1];
            if (! $this->isLanIpv4($ip)) {
                continue;
            }

            if (preg_match('/vEthernet|Virtual|VMware|WSL|Hyper-V|Loopback|Bluetooth|Teredo/i', $adapter)) {
                continue;
            }

            $candidates[] = $ip;
        }

        foreach ($candidates as $ip) {
            if (str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
                return $ip;
            }
        }

        return $candidates[0] ?? null;
    }

    private function isLanIpv4(string $ip): bool
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return false;
        }

        if (str_starts_with($ip, '127.') || str_starts_with($ip, '169.254.')) {
            return false;
        }

        return str_starts_with($ip, '10.')
            || str_starts_with($ip, '192.168.')
            || (bool) preg_match('/^172\.(1[6-9]|2\d|3[0-1])\./', $ip);
    }
}
