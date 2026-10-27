<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillingSchedule extends Model
{
    protected $fillable = [
        'customer_id',
        'customer_name',
        'project_id',
        'project_name',
        'invoice_no',
        'transaction_date',
        'withholding_tax',
        'retention_amount',
        'recoupment_amount',
        'mobilization_amount',
        'contract_amount',
        'monthly_amount',
        'start_date',
        'end_date',
        'run_day',
        'remarks',
        'items',
        'installment_dates',
        'installment_amounts',
        'status',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'withholding_tax' => 'decimal:2',
        'retention_amount' => 'decimal:2',
        'recoupment_amount' => 'decimal:2',
        'mobilization_amount' => 'decimal:2',
        'contract_amount' => 'decimal:2',
        'monthly_amount' => 'decimal:2',
        'run_day' => 'integer',
        'items' => 'array',
        'installment_dates' => 'array',
        'installment_amounts' => 'array',
    ];

    public function billings(): HasMany
    {
        return $this->hasMany(BillingEntry::class);
    }
}
