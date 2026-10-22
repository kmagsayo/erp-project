<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->string('item_name');
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('brand_id')->constrained('brands')->restrictOnDelete();
            $table->foreignId('model_id')->constrained('product_models')->restrictOnDelete();
            $table->foreignId('unit_of_measure_id')->constrained('unit_of_measures')->restrictOnDelete();
            $table->text('description')->nullable();
            $table->unsignedInteger('minimum_stock')->default(0);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->index('status');
            $table->index('item_name');
            $table->index(['category_id', 'brand_id', 'model_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
