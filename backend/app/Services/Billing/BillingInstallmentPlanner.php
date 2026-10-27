<?php

namespace App\Services\Billing;

use Carbon\Carbon;
use InvalidArgumentException;

class BillingInstallmentPlanner
{
    /**
     * @return array<int, string>
     */
    public function dates(string $start, string $end, int $runDay): array
    {
        $startDate = Carbon::parse($start)->startOfDay();
        $endDate = Carbon::parse($end)->startOfDay();

        if ($endDate->lt($startDate)) {
            throw new InvalidArgumentException('End date cannot be before the start date.');
        }
        if ($runDay < 1 || $runDay > 31) {
            throw new InvalidArgumentException('Enter a run script day from 1 to 31.');
        }

        $dueDay = (int) $startDate->day;
        $dates = [];
        for ($index = 1; $index <= 360; $index++) {
            $due = $this->monthDate($startDate, $index, $dueDay);

            if ($due->gt($endDate)) {
                break;
            }

            $dates[] = $due->toDateString();
        }

        if ($dates === []) {
            throw new InvalidArgumentException('No installment dates fall in the selected period.');
        }

        return $dates;
    }

    /**
     * @param  array<int, string>  $dates
     * @return array<int, float>
     */
    public function amounts(float $contractAmount, array $dates): array
    {
        $count = count($dates);
        if ($count < 1) {
            throw new InvalidArgumentException('No installment dates fall in the selected period.');
        }

        $cents = (int) round($contractAmount * 100);
        if ($cents <= 0) {
            throw new InvalidArgumentException('Enter the contract amount.');
        }

        $base = intdiv($cents, $count);
        $remainder = $cents - ($base * $count);
        $amounts = [];

        for ($index = 0; $index < $count; $index++) {
            $share = $base + ($index === $count - 1 ? $remainder : 0);
            $amounts[] = $share / 100;
        }

        return $amounts;
    }

    private function monthDate(Carbon $start, int $offset, int $runDay): Carbon
    {
        $cursor = $start->copy()->startOfMonth()->addMonthsNoOverflow($offset);
        $day = min($runDay, $cursor->daysInMonth);

        return $cursor->day($day)->startOfDay();
    }
}
