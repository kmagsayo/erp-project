<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeliveryReceiptTokenController extends Controller
{
    public function show(Request $request)
    {
        $token = $this->normalizeToken($request->query('token'));
        if ($token === null) {
            return ApiResponse::error('This QR code is not a delivery receipt.', [
                'token' => ['Invalid delivery receipt QR.'],
            ], 422);
        }

        $row = DB::table('delivery_receipt_tokens')->where('token', $token)->first();
        if (! $row) {
            return ApiResponse::error('This QR code does not match a delivery receipt.', null, 404);
        }

        return ApiResponse::success($this->payload($row));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user || ($user->status ?? 'active') !== 'active') {
            return ApiResponse::error('You do not have permission to confirm this delivery.', null, 403);
        }

        $token = $this->normalizeToken($request->input('token'));
        $receiptId = strtoupper(trim((string) $request->input('receiptId')));
        if ($token === null || preg_match('/^DR-[A-Z0-9-]+$/', $receiptId) !== 1) {
            return ApiResponse::error('This QR code is not a delivery receipt.', [
                'token' => ['Invalid delivery receipt QR.'],
            ], 422);
        }

        $existing = DB::table('delivery_receipt_tokens')->where('token', $token)->first();
        if ($existing) {
            if ($existing->receipt_id !== $receiptId) {
                return ApiResponse::error('This QR code is already used by another delivery receipt.', null, 409);
            }

            return ApiResponse::success($this->payload($existing));
        }

        try {
            $id = DB::table('delivery_receipt_tokens')->insertGetId([
                'token' => $token,
                'receipt_id' => $receiptId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (QueryException) {
            $existing = DB::table('delivery_receipt_tokens')->where('token', $token)->first();
            if (! $existing || $existing->receipt_id !== $receiptId) {
                return ApiResponse::error('This QR code is already used by another delivery receipt.', null, 409);
            }

            return ApiResponse::success($this->payload($existing));
        }

        $row = DB::table('delivery_receipt_tokens')->where('id', $id)->first();

        return ApiResponse::success($this->payload($row), 'Delivery receipt QR registered.');
    }

    public function confirm(Request $request)
    {
        $user = $request->user();
        if (! $user || ($user->status ?? 'active') !== 'active') {
            return ApiResponse::error('You do not have permission to confirm this delivery.', null, 403);
        }

        $token = $this->normalizeToken($request->input('token'));
        if ($token === null) {
            return ApiResponse::error('This QR code is not a delivery receipt.', [
                'token' => ['Invalid delivery receipt QR.'],
            ], 422);
        }

        $remarks = trim((string) $request->input('remarks', ''));
        if (mb_strlen($remarks) > 500) {
            return ApiResponse::error('Validation failed.', [
                'remarks' => ['Remarks must be 500 characters or less.'],
            ], 422);
        }

        $receivedAt = now('Asia/Manila');

        try {
            $result = DB::transaction(function () use ($token, $user, $remarks, $receivedAt) {
                $existing = DB::table('delivery_receipt_tokens')
                    ->where('token', $token)
                    ->lockForUpdate()
                    ->first();
                if (! $existing) {
                    return ['missing' => true, 'row' => null];
                }
                if ($existing->received_at !== null) {
                    return ['duplicate' => true, 'row' => $existing];
                }

                DB::table('delivery_receipt_tokens')->where('id', $existing->id)->update([
                    'user_id' => $user->id,
                    'received_by_name' => $user->name,
                    'remarks' => $remarks !== '' ? $remarks : null,
                    'received_at' => $receivedAt,
                    'updated_at' => $receivedAt,
                ]);

                return [
                    'duplicate' => false,
                    'row' => DB::table('delivery_receipt_tokens')->where('id', $existing->id)->first(),
                ];
            });
        } catch (QueryException) {
            return ApiResponse::error('Could not confirm this delivery.', null, 500);
        }

        if (! empty($result['missing'])) {
            return ApiResponse::error('This QR code does not match a delivery receipt.', null, 404);
        }
        if (! empty($result['duplicate'])) {
            return response()->json([
                'success' => false,
                'message' => 'This delivery was already confirmed.',
                'data' => $this->payload($result['row']),
            ], 409);
        }

        Log::info('Delivery receipt confirmed.', [
            'receipt_id' => $result['row']->receipt_id,
            'user_id' => $user->id,
        ]);

        return ApiResponse::success($this->payload($result['row']), 'Delivery confirmed.');
    }

    private function normalizeToken(mixed $value): ?string
    {
        $compact = strtoupper(preg_replace('/\s+/', '', (string) $value) ?? '');
        if (preg_match('/(?:^|[?&]C=)(DRCV:[A-F0-9]{32})/', $compact, $matches) === 1) {
            $compact = $matches[1];
        }
        if (str_starts_with($compact, 'DRCV:')) {
            $compact = substr($compact, strlen('DRCV:'));
        }
        if (preg_match('/^[A-F0-9]{32}$/', $compact) !== 1) {
            return null;
        }

        return strtolower($compact);
    }

    private function payload(object $row): array
    {
        return [
            'receiptId' => $row->receipt_id,
            'token' => $row->token,
            'receivedBy' => $row->received_by_name ?? '',
            'receivedAt' => $row->received_at
                ? Carbon::parse($row->received_at)->timezone('Asia/Manila')->toIso8601String()
                : '',
            'remarks' => $row->remarks ?? '',
            'confirmed' => $row->received_at !== null,
        ];
    }
}
