<?php

use App\Services\Billing\BillingScheduleService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('billings:release-due', function (BillingScheduleService $service) {
    $created = $service->releaseDue();
    $this->info("Released {$created} billing installment(s).");
})->purpose('Insert scheduled billings whose due date has arrived');

Schedule::command('billings:release-due')
    ->dailyAt('00:05')
    ->timezone('Asia/Manila')
    ->withoutOverlapping();
