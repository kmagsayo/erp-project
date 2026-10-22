<?php

use App\Models\Customer;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach (Customer::query()->orderBy('id')->get() as $customer) {
            $customer->update(['code' => 'CUST-TMP-'.$customer->id]);
        }

        foreach (Customer::query()->orderBy('id')->get() as $customer) {
            $customer->update([
                'code' => 'CUST-'.str_pad((string) $customer->id, 3, '0', STR_PAD_LEFT),
            ]);
        }
    }

    public function down(): void
    {
        // Codes were normalized in place; previous values are not restored.
    }
};
