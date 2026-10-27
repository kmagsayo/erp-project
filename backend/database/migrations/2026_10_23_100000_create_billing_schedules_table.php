<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id');
            $table->string('customer_name');
            $table->string('project_id');
            $table->string('project_name');
            $table->string('invoice_no')->nullable()->unique();
            $table->date('transaction_date');
            $table->decimal('withholding_tax', 14, 2)->default(0);
            $table->decimal('retention_amount', 14, 2)->default(0);
            $table->decimal('recoupment_amount', 14, 2)->default(0);
            $table->decimal('mobilization_amount', 14, 2)->default(0);
            $table->decimal('contract_amount', 14, 2);
            $table->decimal('monthly_amount', 14, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedTinyInteger('run_day');
            $table->text('remarks')->nullable();
            $table->json('items')->nullable();
            $table->json('installment_dates');
            $table->json('installment_amounts');
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index('status');
            $table->index('start_date');
        });

        Schema::create('billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_schedule_id')->constrained('billing_schedules')->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_no');
            $table->date('due_date');
            $table->string('billing_no')->unique();
            $table->string('invoice_no')->unique();
            $table->string('customer_id');
            $table->string('customer_name');
            $table->string('project_id');
            $table->string('project_name');
            $table->decimal('withholding_tax', 14, 2)->default(0);
            $table->decimal('retention_amount', 14, 2)->default(0);
            $table->decimal('recoupment_amount', 14, 2)->default(0);
            $table->decimal('mobilization_amount', 14, 2)->default(0);
            $table->decimal('contract_amount', 14, 2);
            $table->decimal('monthly_amount', 14, 2);
            $table->decimal('net_amount', 14, 2);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('run_script_date');
            $table->text('remarks')->nullable();
            $table->json('items')->nullable();
            $table->timestamps();

            $table->unique(['billing_schedule_id', 'installment_no']);
            $table->unique(['billing_schedule_id', 'due_date']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billings');
        Schema::dropIfExists('billing_schedules');
    }
};
