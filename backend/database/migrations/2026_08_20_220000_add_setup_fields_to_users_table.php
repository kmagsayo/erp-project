<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('position_id')->nullable()->after('username')->constrained('positions')->nullOnDelete();
            $table->string('type', 20)->default('user')->after('password');
            $table->string('status', 20)->default('active')->after('type');

            $table->index('status');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('position_id');
            $table->dropColumn(['type', 'status']);
        });
    }
};
