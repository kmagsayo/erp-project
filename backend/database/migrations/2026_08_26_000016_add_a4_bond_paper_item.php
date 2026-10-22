<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Item;
use App\Models\ProductModel;
use App\Models\UnitOfMeasure;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private const ITEM_NAME = 'A4 Bond Paper';

    private const BARCODE = '4801234567890';

    public function up(): void
    {
        $existing = Item::query()->where('item_name', self::ITEM_NAME)->first();
        if ($existing) {
            if (! $existing->barcode && ! Item::query()->where('barcode', self::BARCODE)->exists()) {
                $existing->update(['barcode' => self::BARCODE]);
            }

            return;
        }

        $brand = Brand::query()->firstOrCreate(
            ['name' => 'GENERIC'],
            [
                'code' => 'BRD-GEN',
                'description' => 'Generic office products.',
                'status' => 'active',
            ],
        );
        $category = Category::query()->firstOrCreate(
            ['name' => 'OFFICE SUPPLIES'],
            [
                'code' => 'CAT-OFFICE',
                'description' => 'Office supplies.',
                'status' => 'active',
            ],
        );
        $unit = UnitOfMeasure::query()->firstOrCreate(
            ['name' => 'REAM'],
            [
                'code' => 'REAM',
                'symbol' => 'rm',
                'status' => 'active',
            ],
        );
        $model = ProductModel::query()->firstOrCreate(
            [
                'brand_id' => $brand->id,
                'name' => 'A4 70GSM',
            ],
            [
                'status' => 'active',
            ],
        );
        if (! $model->code) {
            $model->update([
                'code' => 'MOD-'.str_pad((string) $model->id, 3, '0', STR_PAD_LEFT),
            ]);
        }

        if (Item::query()->where('barcode', self::BARCODE)->exists()) {
            return;
        }

        $item = Item::query()->create([
            'item_code' => 'ITM-TMP-A4',
            'barcode' => self::BARCODE,
            'item_name' => self::ITEM_NAME,
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'model_id' => $model->id,
            'unit_of_measure_id' => $unit->id,
            'minimum_stock' => 5,
            'stock_on_hand' => 80,
            'status' => 'active',
        ]);

        $item->update([
            'item_code' => 'ITM-'.str_pad((string) $item->id, 4, '0', STR_PAD_LEFT),
        ]);
    }

    public function down(): void
    {
        Item::query()->where('barcode', self::BARCODE)->delete();
    }
};
