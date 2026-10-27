<?php

namespace App\Services\Billing;

use App\Models\BillingEntry;
use App\Models\BillingSchedule;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BillingScheduleService
{
    public function __construct(private readonly BillingInstallmentPlanner $planner) {}

    public function schedule(array $data): BillingSchedule
    {
        $runDay = (int) $data['run_day'];
        $dates = $this->planner->dates($data['start_date'], $data['end_date'], $runDay);
        $amounts = $this->planner->amounts((float) $data['contract_amount'], $dates);
        $invoiceNo = trim((string) ($data['invoice_no'] ?? ''));

        if ($invoiceNo !== '' && BillingSchedule::query()->where('invoice_no', $invoiceNo)->exists()) {
            throw new InvalidArgumentException('That invoice number is already used.');
        }
        if ($invoiceNo !== '' && BillingEntry::query()->where('invoice_no', $invoiceNo)->exists()) {
            throw new InvalidArgumentException('That invoice number is already used.');
        }

        $schedule = BillingSchedule::query()->create([
            'customer_id' => (string) $data['customer_id'],
            'customer_name' => trim((string) $data['customer_name']),
            'project_id' => (string) $data['project_id'],
            'project_name' => trim((string) $data['project_name']),
            'invoice_no' => $invoiceNo !== '' ? $invoiceNo : null,
            'transaction_date' => $data['transaction_date'],
            'withholding_tax' => $this->money($data['withholding_tax'] ?? 0),
            'retention_amount' => $this->money($data['retention_amount'] ?? 0),
            'recoupment_amount' => $this->money($data['recoupment_amount'] ?? 0),
            'mobilization_amount' => $this->money($data['mobilization_amount'] ?? 0),
            'contract_amount' => $this->money($data['contract_amount']),
            'monthly_amount' => $amounts[0],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'run_day' => $runDay,
            'remarks' => trim((string) ($data['remarks'] ?? '')),
            'items' => array_values($data['items'] ?? []),
            'installment_dates' => $dates,
            'installment_amounts' => $amounts,
            'status' => 'pending',
        ]);

        $this->releaseDue();

        return $schedule->fresh();
    }

    public function releaseDue(?string $today = null): int
    {
        $today ??= Carbon::now('Asia/Manila')->toDateString();
        $created = 0;

        $scheduleIds = BillingSchedule::query()
            ->where('status', '!=', 'completed')
            ->orderBy('id')
            ->pluck('id');

        foreach ($scheduleIds as $scheduleId) {
            $created += $this->releaseSchedule((int) $scheduleId, $today);
        }

        return $created;
    }

    public function pendingSchedules(): array
    {
        return BillingSchedule::query()
            ->where('status', 'pending')
            ->whereDoesntHave('billings')
            ->orderBy('start_date')
            ->orderBy('id')
            ->get()
            ->map(fn (BillingSchedule $schedule) => $this->presentSchedule($schedule))
            ->all();
    }

    public function deleteSchedule(int $scheduleId): void
    {
        $schedule = BillingSchedule::query()->findOrFail($scheduleId);
        $schedule->delete();
    }

    public function deleteBilling(int $billingId): void
    {
        DB::transaction(function () use ($billingId) {
            $billing = BillingEntry::query()->lockForUpdate()->findOrFail($billingId);
            $schedule = BillingSchedule::query()->lockForUpdate()->find($billing->billing_schedule_id);
            $billing->delete();

            if (! $schedule) {
                return;
            }

            $dates = array_values($schedule->installment_dates ?? []);
            $index = $billing->installment_no - 1;
            if (array_key_exists($index, $dates)) {
                $dates[$index] = null;
                $schedule->installment_dates = $dates;
            }

            $remaining = BillingEntry::query()
                ->where('billing_schedule_id', $schedule->id)
                ->count();
            $expected = count(array_filter($dates, fn ($date) => $date !== null && $date !== ''));
            if ($remaining === 0 && $expected === 0) {
                $schedule->delete();
                return;
            }

            $schedule->status = $remaining === 0
                ? 'pending'
                : ($expected > 0 && $remaining >= $expected ? 'completed' : 'active');
            $schedule->save();
        });
    }

    public function activeBillings(): array
    {
        $this->releaseDue();

        return BillingEntry::query()
            ->with('schedule')
            ->orderBy('due_date')
            ->orderBy('id')
            ->get()
            ->map(fn (BillingEntry $billing) => $this->present($billing))
            ->all();
    }

    private function releaseSchedule(int $scheduleId, string $today): int
    {
        return DB::transaction(function () use ($scheduleId, $today) {
            $schedule = BillingSchedule::query()->lockForUpdate()->find($scheduleId);
            if (! $schedule || $schedule->status === 'completed') {
                return 0;
            }

            $dates = array_values($schedule->installment_dates ?? []);
            $amounts = array_values($schedule->installment_amounts ?? []);
            $created = 0;
            $expected = 0;

            foreach ($dates as $index => $dueDate) {
                if ($dueDate === null || $dueDate === '') {
                    continue;
                }
                $expected++;
                if ($dueDate > $today) {
                    continue;
                }

                $installmentNo = $index + 1;
                $already = BillingEntry::query()
                    ->where('billing_schedule_id', $schedule->id)
                    ->where('installment_no', $installmentNo)
                    ->exists();
                if ($already) {
                    continue;
                }

                try {
                    $saved = false;
                    for ($attempt = 0; $attempt < 3 && ! $saved; $attempt++) {
                        try {
                            BillingEntry::query()->create($this->installmentAttributes(
                                $schedule,
                                $installmentNo,
                                $dueDate,
                                (float) ($amounts[$index] ?? $schedule->monthly_amount),
                            ));
                            $created++;
                            $saved = true;
                        } catch (QueryException $exception) {
                            if (! $this->isUniqueViolation($exception)) {
                                throw $exception;
                            }
                            $saved = BillingEntry::query()
                                ->where('billing_schedule_id', $schedule->id)
                                ->where('installment_no', $installmentNo)
                                ->exists();
                        }
                    }
                } catch (QueryException $exception) {
                    if (! $this->isUniqueViolation($exception)) {
                        throw $exception;
                    }
                }
            }

            $released = BillingEntry::query()
                ->where('billing_schedule_id', $schedule->id)
                ->count();
            $schedule->status = $released === 0
                ? 'pending'
                : ($expected > 0 && $released >= $expected ? 'completed' : 'active');
            $schedule->save();

            return $created;
        });
    }

    private function installmentAttributes(
        BillingSchedule $schedule,
        int $installmentNo,
        string $dueDate,
        float $amount,
    ): array {
        $billingNo = $this->nextBillingNo();
        $invoiceNo = $this->invoiceNoFor($schedule, $installmentNo, $billingNo);

        return [
            'billing_schedule_id' => $schedule->id,
            'installment_no' => $installmentNo,
            'due_date' => $dueDate,
            'billing_no' => $billingNo,
            'invoice_no' => $invoiceNo,
            'customer_id' => $schedule->customer_id,
            'customer_name' => $schedule->customer_name,
            'project_id' => $schedule->project_id,
            'project_name' => $schedule->project_name,
            'withholding_tax' => $schedule->withholding_tax,
            'retention_amount' => $schedule->retention_amount,
            'recoupment_amount' => $schedule->recoupment_amount,
            'mobilization_amount' => $schedule->mobilization_amount,
            'contract_amount' => $schedule->contract_amount,
            'monthly_amount' => $schedule->monthly_amount,
            'net_amount' => $amount,
            'amount_paid' => 0,
            'start_date' => $schedule->start_date,
            'end_date' => $schedule->end_date,
            'run_script_date' => 'Every '.$schedule->run_day.' of the month',
            'remarks' => $schedule->remarks,
            'items' => $this->itemsForAmount($schedule->items ?? [], $amount, $schedule->project_name, $schedule->customer_name),
        ];
    }

    private function itemsForAmount(array $items, float $amount, string $projectName, string $customerName): array
    {
        $lines = array_values(array_filter($items, fn ($item) => trim((string) ($item['description'] ?? '')) !== ''));
        if ($lines !== []) {
            return $lines;
        }

        return [[
            'id' => (string) str()->uuid(),
            'description' => $projectName !== '' ? $projectName : $customerName,
            'quantity' => 1,
            'unit' => 'lot',
            'unitPrice' => $amount,
            'amount' => $amount,
        ]];
    }

    private function invoiceNoFor(BillingSchedule $schedule, int $installmentNo, string $billingNo): string
    {
        $base = trim((string) $schedule->invoice_no);
        if ($base === '') {
            return $billingNo;
        }

        $candidate = $installmentNo === 1 ? $base : $base.'-'.str_pad((string) $installmentNo, 2, '0', STR_PAD_LEFT);
        if (! BillingEntry::query()->where('invoice_no', $candidate)->exists()) {
            return $candidate;
        }

        return $billingNo;
    }

    private function nextBillingNo(): string
    {
        $max = 0;
        foreach (BillingEntry::query()->pluck('billing_no') as $number) {
            $digits = preg_replace('/\D/', '', (string) $number);
            $max = max($max, (int) $digits);
        }

        return 'BS-'.str_pad((string) ($max + 1), 5, '0', STR_PAD_LEFT);
    }

    private function present(BillingEntry $billing): array
    {
        $net = (float) $billing->net_amount;
        $paid = (float) $billing->amount_paid;
        $balance = max(0, round($net - $paid, 2));
        $status = $balance <= 0 && $net > 0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid');

        $schedule = $billing->schedule;
        $installmentCount = 0;
        if ($schedule) {
            $installmentCount = count(array_filter(
                array_values($schedule->installment_dates ?? []),
                fn ($date) => $date !== null && $date !== '',
            ));
        }

        return [
            'id' => 'db-'.$billing->id,
            'billingNo' => $billing->billing_no,
            'customerId' => $billing->customer_id,
            'customerName' => $billing->customer_name,
            'projectId' => $billing->project_id,
            'projectName' => $billing->project_name,
            'invoiceNo' => $billing->invoice_no,
            'deliveryReceiptId' => '',
            'deliveryReceiptNo' => '',
            'date' => $billing->due_date?->toDateString() ?? '',
            'dueDate' => $billing->due_date?->toDateString() ?? '',
            'status' => $status,
            'items' => $billing->items ?? [],
            'subtotal' => $net,
            'tax' => 0,
            'withholdingTax' => (float) $billing->withholding_tax,
            'retentionAmount' => (float) $billing->retention_amount,
            'managementAmount' => (float) $billing->recoupment_amount,
            'mobilizationAmount' => (float) $billing->mobilization_amount,
            'contractAmount' => (float) $billing->contract_amount,
            'monthlyRecurring' => (float) $billing->monthly_amount,
            'startDate' => $billing->start_date?->toDateString() ?? '',
            'endDate' => $billing->end_date?->toDateString() ?? '',
            'runScriptDate' => $billing->run_script_date,
            'installmentNo' => (int) $billing->installment_no,
            'installmentCount' => $installmentCount,
            'total' => $net,
            'amountPaid' => $paid,
            'balance' => $balance,
            'remarks' => $billing->remarks ?? '',
        ];
    }

    private function presentSchedule(BillingSchedule $schedule): array
    {
        $dates = array_values(array_filter(
            $schedule->installment_dates ?? [],
            fn ($date) => $date !== null && $date !== '',
        ));
        $first = $dates[0] ?? $schedule->start_date?->toDateString() ?? '';
        $monthly = (float) $schedule->monthly_amount;

        return [
            'id' => 'schedule-'.$schedule->id,
            'billingNo' => $schedule->invoice_no ?: 'Scheduled',
            'customerId' => $schedule->customer_id,
            'customerName' => $schedule->customer_name,
            'projectId' => $schedule->project_id,
            'projectName' => $schedule->project_name,
            'invoiceNo' => $schedule->invoice_no ?? '',
            'deliveryReceiptId' => '',
            'deliveryReceiptNo' => '',
            'date' => $first,
            'dueDate' => $first,
            'status' => 'unpaid',
            'items' => $schedule->items ?? [],
            'subtotal' => $monthly,
            'tax' => 0,
            'withholdingTax' => (float) $schedule->withholding_tax,
            'retentionAmount' => (float) $schedule->retention_amount,
            'managementAmount' => (float) $schedule->recoupment_amount,
            'mobilizationAmount' => (float) $schedule->mobilization_amount,
            'contractAmount' => (float) $schedule->contract_amount,
            'monthlyRecurring' => $monthly,
            'startDate' => $schedule->start_date?->toDateString() ?? '',
            'endDate' => $schedule->end_date?->toDateString() ?? '',
            'runScriptDate' => 'Every '.$schedule->run_day.' of the month',
            'total' => $monthly,
            'amountPaid' => 0,
            'balance' => $monthly,
            'remarks' => $schedule->remarks ?? '',
        ];
    }

    private function money(mixed $value): float
    {
        $amount = (float) $value;
        if (! is_finite($amount) || $amount < 0) {
            throw new InvalidArgumentException('Amounts cannot be negative.');
        }

        return round($amount, 2);
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? '';

        return $sqlState === '23000' || str_contains(strtolower($exception->getMessage()), 'unique');
    }
}
