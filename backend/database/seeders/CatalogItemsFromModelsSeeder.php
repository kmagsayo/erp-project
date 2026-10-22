<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Item;
use App\Models\ProductModel;
use App\Models\UnitOfMeasure;
use Illuminate\Database\Seeder;

class CatalogItemsFromModelsSeeder extends Seeder
{
    public function run(): void
    {
        $created = 0;

        foreach (Brand::query()->orderBy('id')->get() as $brand) {
            if (Item::query()->where('brand_id', $brand->id)->exists()) {
                continue;
            }

            $this->createBrandItem($brand);
            $created++;
        }

        $this->command?->info("Added {$created} brand items. Each brand now has at least one item.");
    }

    private function createBrandItem(Brand $brand): void
    {
        $model = ProductModel::query()
            ->where('brand_id', $brand->id)
            ->orderBy('id')
            ->first();

        if ($model && strcasecmp($brand->name, 'GENERIC') === 0) {
            [$itemName, $categoryName, $unitName, $requiresSerial, $unitPrice, $stock] = [
                'A4 Bond Paper', 'OFFICE SUPPLIES', 'REAM', false, 2500, 10,
            ];
        } elseif ($model) {
            [$categoryName, , $unitName, $requiresSerial, $unitPrice, $stock] = $this->describe($model->name);
            $itemName = $this->productName($model);
        } else {
            [$itemName, $categoryName, $unitName, $requiresSerial, $unitPrice, $stock] = $this->defaultProduct($brand->name);
            $model = ProductModel::query()->firstOrCreate(
                ['brand_id' => $brand->id, 'name' => $itemName],
                [
                    'code' => 'MOD-'.str_pad((string) $brand->id, 3, '0', STR_PAD_LEFT),
                    'status' => 'active',
                ],
            );
        }

        $categoryId = Category::query()->where('name', $categoryName)->value('id')
            ?? Category::query()->orderBy('id')->value('id');
        $unitId = UnitOfMeasure::query()->where('name', $unitName)->value('id')
            ?? UnitOfMeasure::query()->where('name', 'UNIT')->value('id');

        if (! $categoryId || ! $unitId || ! $model) {
            $this->command?->warn("Skipped {$brand->name} because a category, unit, or model is missing.");

            return;
        }

        $item = Item::query()->create([
            'item_code' => 'ITM-TMP-'.$brand->id,
            'item_name' => $itemName,
            'unit_price' => $unitPrice,
            'category_id' => $categoryId,
            'brand_id' => $brand->id,
            'model_id' => $model->id,
            'unit_of_measure_id' => $unitId,
            'description' => trim($brand->name.' '.$itemName),
            'minimum_stock' => $requiresSerial ? 1 : 0,
            'stock_on_hand' => $stock,
            'requires_serial' => $requiresSerial,
            'status' => 'active',
        ]);

        $item->update([
            'item_code' => 'ITM-'.str_pad((string) $item->id, 4, '0', STR_PAD_LEFT),
            'barcode' => '480'.str_pad((string) $item->id, 10, '0', STR_PAD_LEFT),
        ]);
    }

    private function productName(ProductModel $model): string
    {
        return trim((string) preg_replace('/ #\d+$/', '', trim($model->name)));
    }

    /**
     * @return array{0: string, 1: string, 2: string, 3: bool, 4: float, 5: int}
     */
    private function defaultProduct(string $brandName): array
    {
        return match (strtoupper(trim($brandName))) {
            'IMOU', 'BOSCH', 'TIANDY', 'PANASONIC' => ['IP camera', 'IP CAMERA', 'UNIT', true, 4500, 2],
            'CISCO', 'TPLINK', 'RUIJIE' => ['Network switch', 'SWITCHES/ROUTER', 'UNIT', false, 4500, 2],
            'UBIQUITI', 'OMADA BY TPLINK' => ['Access point', 'SWITCHES/ROUTER', 'UNIT', false, 5500, 2],
            'VSOL' => ['ONU modem', 'SWITCHES/ROUTER', 'UNIT', true, 1800, 2],
            'LOTUS', 'KEN', 'ROYU' => ['Electrical cable', 'CABLES', 'METER/S', false, 40, 20],
            'COMLINK', 'PREMIUM LINE', 'CCA' => ['Network cable', 'CABLES', 'METER/S', false, 25, 30],
            'ONTI' => ['Fiber optic cable', 'CABLES', 'METER/S', false, 20, 30],
            'EPSON', 'HP', 'BROTHER' => ['Printer', 'OFFICE SUPPLIES', 'UNIT', true, 9000, 1],
            'SAMSUNG' => ['Monitor', 'OFFICE SUPPLIES', 'UNIT', false, 7500, 1],
            'SUNMI' => ['POS terminal', 'OFFICE SUPPLIES', 'UNIT', true, 12000, 1],
            'ANKER' => ['Power bank', 'OFFICE SUPPLIES', 'PC/S', false, 1500, 4],
            'APC' => ['UPS', 'OFFICE SUPPLIES', 'UNIT', true, 6000, 2],
            'INGCO' => ['Power tool', 'OFFICE SUPPLIES', 'UNIT', false, 2500, 2],
            'SEAGATE', 'WESTERN DIGITAL' => ['Hard disk drive', 'OFFICE SUPPLIES', 'PC/S', true, 3500, 4],
            'ZKTECO' => ['Access control terminal', 'OFFICE SUPPLIES', 'UNIT', true, 8000, 1],
            'ITC', 'SPON' => ['IP speaker', 'OFFICE SUPPLIES', 'UNIT', true, 4500, 2],
            'GOODWE' => ['Solar inverter', 'OFFICE SUPPLIES', 'UNIT', true, 25000, 1],
            'GENERIC' => ['A4 Bond Paper', 'OFFICE SUPPLIES', 'REAM', false, 2500, 10],
            default => [trim($brandName).' product', 'OFFICE SUPPLIES', 'UNIT', false, 0, 1],
        };
    }

    /**
     * @return array{0: string, 1: string, 2: string, 3: bool, 4: float, 5: int}
     */
    private function describe(string $modelName): array
    {
        $name = strtoupper(trim($modelName));

        if (str_contains($name, 'XVR')) {
            return ['DVR', 'Digital video recorder', 'UNIT', true, 8500, 2];
        }

        if (
            str_contains($name, 'NVR')
            || preg_match('/^DS-(72|76|96)/', $name) === 1
            || preg_match('/^DHI-5432/', $name) === 1
        ) {
            return ['NVR', 'Network video recorder', 'UNIT', true, 12000, 2];
        }

        if (
            preg_match('/^DS-3(E|WR)/', $name) === 1
            || preg_match('/(^|-)PFS/', $name) === 1
            || str_contains($name, 'CS4006')
            || str_contains($name, 'CHS-')
        ) {
            return ['SWITCHES/ROUTER', 'Network switch', 'UNIT', false, 3500, 3];
        }

        if (str_starts_with($name, 'DS-1296')) {
            return ['IP CAMERA', 'Camera mount', 'PC/S', false, 450, 6];
        }

        if (preg_match('/^DS-2(DE|SE)/', $name) === 1) {
            return ['IP CAMERA', 'PTZ camera', 'UNIT', true, 15000, 2];
        }

        if (
            str_starts_with($name, 'DS-2CE')
            || str_contains($name, 'HAC-')
            || str_contains($name, 'TVI-')
        ) {
            return ['ANALOG CAMERA', 'Analog camera', 'UNIT', true, 1800, 4];
        }

        return ['IP CAMERA', 'IP camera', 'UNIT', true, 4500, 4];
    }
}
