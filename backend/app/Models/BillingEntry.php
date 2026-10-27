<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingEntry extends Model
{
    protected $table = 'billings';

    protected $fillable = [
        'billing_schedule_id',
        'installment_no',
        'due_date',
        'billing_no',
        'invoice_no',
        'customer_id',
        'customer_name',
        'project_id',
        'project_name',
        'withholding_tax',
        'retention_amount',
        'recoupment_amount',
        'mobilization_amount',
        'contract_amount',
        'monthly_amount',
        'net_amount',
        'amount_paid',
        'start_date',
        'end_date',
        'run_script_date',
        'remarks',
        'items',
    ];

    protected $casts = [
        'due_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'withholding_tax' => 'decimal:2',
        'retention_amount' => 'decimal:2',
        'recoupment_amount' => 'decimal:2',
        'mobilization_amount' => 'decimal:2',
        'contract_amount' => 'decimal:2',
        'monthly_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'items' => 'array',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(BillingSchedule::class, 'billing_schedule_id');
    }
}
