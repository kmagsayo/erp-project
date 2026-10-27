<?php

namespace Tests\Unit;

use App\Services\Billing\BillingInstallmentPlanner;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class BillingInstallmentPlannerTest extends TestCase
{
    public function test_first_installment_is_one_month_after_the_start_date(): void
    {
        $dates = (new BillingInstallmentPlanner())->dates('2026-10-23', '2027-10-23', 23);

        $this->assertCount(12, $dates);
        $this->assertSame('2026-11-23', $dates[0]);
        $this->assertSame('2026-12-23', $dates[1]);
        $this->assertSame('2027-01-23', $dates[2]);
        $this->assertSame('2027-10-23', $dates[11]);
    }

    public function test_short_months_use_the_last_valid_day_and_later_months_keep_the_start_day(): void
    {
        $dates = (new BillingInstallmentPlanner())->dates('2026-01-31', '2026-04-30', 31);

        $this->assertSame(['2026-02-28', '2026-03-31', '2026-04-30'], $dates);
    }

    public function test_leap_day_is_used_when_the_target_month_has_it(): void
    {
        $dates = (new BillingInstallmentPlanner())->dates('2028-01-31', '2028-03-31', 15);

        $this->assertSame(['2028-02-29', '2028-03-31'], $dates);
    }

    public function test_same_start_and_end_date_has_no_installment(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('No installment dates fall in the selected period.');

        (new BillingInstallmentPlanner())->dates('2026-10-23', '2026-10-23', 23);
    }

    public function test_monthly_amount_splits_the_contract_across_the_installments(): void
    {
        $planner = new BillingInstallmentPlanner();
        $dates = $planner->dates('2026-10-23', '2027-10-23', 23);
        $amounts = $planner->amounts(120000, $dates);

        $this->assertCount(12, $amounts);
        $this->assertEquals(10000, $amounts[0]);
        $this->assertEquals(120000, array_sum($amounts));
    }
}
