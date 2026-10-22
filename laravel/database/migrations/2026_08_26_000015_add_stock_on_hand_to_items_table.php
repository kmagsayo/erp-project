<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('items', 'stock_on_hand')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            $table->unsignedInteger('stock_on_hand')->default(0);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('items', 'stock_on_hand')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('stock_on_hand');
        });
    }
};
