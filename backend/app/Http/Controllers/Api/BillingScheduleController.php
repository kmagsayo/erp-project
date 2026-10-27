<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BillingScheduleRequest;
use App\Services\Billing\BillingScheduleService;
use App\Support\ApiResponse;
use Carbon\Carbon;
use InvalidArgumentException;

class BillingScheduleController extends Controller
{
    public function __construct(private readonly BillingScheduleService $service) {}

    public function index()
    {
        return ApiResponse::success([
            'billings' => $this->service->activeBillings(),
            'schedules' => $this->service->pendingSchedules(),
        ], 'Billings retrieved successfully.');
    }

    public function store(BillingScheduleRequest $request)
    {
        try {
            $schedule = $this->service->schedule($request->validated());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), null, 422);
        }

        $dates = array_values($schedule->installment_dates ?? []);
        $first = $dates[0] ?? $schedule->start_date?->toDateString();
        $last = $dates[array_key_last($dates)] ?? $first;
        $monthly = number_format((float) $schedule->monthly_amount, 2, '.', ',');
        $firstLabel = Carbon::parse($first)->format('F j, Y');
        $lastLabel = Carbon::parse($last)->format('F j, Y');

        return ApiResponse::success([
            'schedule' => [
                'id' => $schedule->id,
                'status' => $schedule->status,
                'monthlyAmount' => (float) $schedule->monthly_amount,
                'installmentCount' => count($dates),
                'firstDueDate' => $first,
                'lastDueDate' => $last,
            ],
        ], "Billing scheduled for {$firstLabel}. Monthly installment is ₱{$monthly}, with the last installment on {$lastLabel}.", 201);
    }

    public function destroySchedule(int $schedule)
    {
        $this->service->deleteSchedule($schedule);

        return ApiResponse::success(null, 'Billing deleted.');
    }

    public function destroy(int $billing)
    {
        $this->service->deleteBilling($billing);

        return ApiResponse::success(null, 'Billing deleted.');
    }
}
