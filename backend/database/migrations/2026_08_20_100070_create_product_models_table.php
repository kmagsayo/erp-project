<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained('brands')->restrictOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->index(['brand_id', 'status']);
            $table->index('name');
            $table->unique(['brand_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_models');
    }
};
