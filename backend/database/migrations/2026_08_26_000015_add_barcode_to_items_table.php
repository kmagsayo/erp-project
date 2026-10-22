<?php

use App\Models\Item;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('barcode', 50)->nullable()->unique()->after('item_code');
        });

        foreach (Item::query()->orderBy('id')->get() as $item) {
            if ($item->barcode) {
                continue;
            }

            $item->update([
                'barcode' => '480'.str_pad((string) $item->id, 10, '0', STR_PAD_LEFT),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropUnique(['barcode']);
            $table->dropColumn('barcode');
        });
    }
};
