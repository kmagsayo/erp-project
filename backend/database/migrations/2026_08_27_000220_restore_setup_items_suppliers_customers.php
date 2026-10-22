<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Item;
use App\Models\ProductModel;
use App\Models\Supplier;
use App\Models\UnitOfMeasure;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->restoreCustomers();
        $this->restoreSuppliers();
        $this->restoreItems();
    }

    public function down(): void
    {
        // Restored operational records are kept.
    }

    protected function restoreCustomers(): void
    {
        if (Schema::hasTable('setup_customer')) {
            foreach (DB::table('setup_customer')->orderBy('id')->get() as $row) {
                $termsType = strtoupper((string) ($row->terms_type ?? ''));
                $this->upsertCustomer([
                    'name' => $row->name,
                    'phone' => $row->name === 'Metro Pacific Retail Corp.' ? '09171112222' : '09173334444',
                    'address' => $row->address,
                    'tin' => $row->tin_no ?? null,
                    'terms' => $row->terms,
                    'terms_type' => $termsType === 'DAYS' ? 'IN DAYS' : ($row->terms_type ?: null),
                    'status' => strtolower((string) $row->status) === 'inactive' ? 'inactive' : 'active',
                ]);
            }
        }

        foreach ([
            [
                'name' => 'ABC Corporation',
                'phone' => '09171234567',
                'address' => '123 Example Street, Cebu City',
                'tin' => '000-555-666-000',
                'terms' => 30,
                'terms_type' => 'IN DAYS',
                'status' => 'active',
            ],
            [
                'name' => 'XYZ Industries',
                'phone' => '09182345678',
                'address' => 'Mandaue City, Cebu',
                'tin' => '000-777-888-000',
                'terms' => 45,
                'terms_type' => 'IN DAYS',
                'status' => 'active',
            ],
            [
                'name' => 'Global Tech Inc.',
                'phone' => '09193456789',
                'address' => 'Cebu IT Park, Lahug, Cebu City',
                'tin' => '000-999-000-000',
                'terms' => 15,
                'terms_type' => 'IN DAYS',
                'status' => 'active',
            ],
        ] as $sample) {
            if (Customer::query()->where('name', $sample['name'])->exists()) {
                continue;
            }
            $this->upsertCustomer($sample);
        }
    }

    protected function restoreSuppliers(): void
    {
        $samples = [
            [
                'name' => 'Hikvision Philippines, Inc.',
                'contact_person' => 'Ana Cruz',
                'phone' => '09171234567',
                'address' => 'Cebu IT Park, Lahug, Cebu City',
                'tin' => '456-789-012-000',
            ],
            [
                'name' => 'Dahua Technology Philippines, Inc.',
                'contact_person' => 'Mark Reyes',
                'phone' => '09182345678',
                'address' => 'Mandaue City, Cebu',
                'tin' => '567-890-123-000',
            ],
            [
                'name' => 'Bosch Security Systems PH',
                'contact_person' => 'Lara Tan',
                'phone' => '09193456789',
                'address' => 'Cebu Business Park, Cebu City',
                'tin' => '678-901-234-000',
            ],
            [
                'name' => 'Cebu Industrial Trading',
                'contact_person' => 'Paolo Lim',
                'phone' => '09204567890',
                'address' => 'Mandaue City, Cebu',
                'tin' => '789-012-345-000',
            ],
            [
                'name' => 'Network Cable Trading',
                'contact_person' => 'Nina Uy',
                'phone' => '09215678901',
                'address' => 'Fuente Osmeña, Cebu City',
                'tin' => '890-123-456-000',
            ],
        ];

        if (Schema::hasTable('setup_supplier')) {
            foreach (DB::table('setup_supplier')->orderBy('id')->get() as $row) {
                $this->upsertSupplier([
                    'name' => $row->name,
                    'contact_person' => $row->contact_person,
                    'phone' => $row->contact_person_no,
                    'address' => $row->address,
                    'tin' => $row->tin_no ?? null,
                ]);
            }
        }

        foreach ($samples as $sample) {
            if (Supplier::query()->where('name', $sample['name'])->exists()) {
                continue;
            }
            $this->upsertSupplier($sample);
        }
    }

    protected function restoreItems(): void
    {
        $samples = [
            [
                'brand' => 'HIKVISION',
                'model' => 'DS-2CD2143G2-I',
                'item_name' => 'Hikvision 4MP Dome Camera',
                'unit' => 'UNIT',
                'category' => 'IP CAMERA',
                'stock_on_hand' => 18,
                'minimum_stock' => 5,
                'unit_price' => 5000,
            ],
            [
                'brand' => 'DAHUA',
                'model' => 'DHI-NVR4108HS',
                'item_name' => 'Dahua 8-Channel NVR',
                'unit' => 'UNIT',
                'category' => 'NVR',
                'stock_on_hand' => 5,
                'minimum_stock' => 10,
                'unit_price' => 18000,
            ],
            [
                'brand' => 'HIKVISION',
                'model' => 'DS-2DF4A425IW-DF',
                'item_name' => 'Hikvision 4K PTZ Camera',
                'unit' => 'UNIT',
                'category' => 'IP CAMERA',
                'stock_on_hand' => 6,
                'minimum_stock' => 3,
                'unit_price' => 22000,
            ],
            [
                'brand' => 'SAMSUNG',
                'model' => 'ST1000VX013',
                'item_name' => 'Samsung 1TB Surveillance HDD',
                'unit' => 'PC/S',
                'category' => 'CCTV',
                'stock_on_hand' => 15,
                'minimum_stock' => 5,
                'unit_price' => 4500,
            ],
            [
                'brand' => 'CISCO',
                'model' => 'CAT6-UTP-305',
                'item_name' => 'Cat6 UTP Cable 305m Box',
                'unit' => 'BOX/ES',
                'category' => 'CABLES',
                'stock_on_hand' => 11,
                'minimum_stock' => 4,
                'unit_price' => 3000,
            ],
            [
                'brand' => 'BOSCH',
                'model' => 'PWR-12V5A',
                'item_name' => '12V 5A Power Adapter',
                'unit' => 'PC/S',
                'category' => 'CCTV',
                'stock_on_hand' => 34,
                'minimum_stock' => 10,
                'unit_price' => 450,
            ],
        ];

        foreach ($samples as $sample) {
            $this->upsertCatalogItem($sample);
        }

        $this->restoreA4BondPaper();
    }

    /**
     * @param  array<string, mixed>  $sample
     */
    protected function upsertCatalogItem(array $sample): void
    {
        $brand = Brand::query()->whereRaw('UPPER(name) = ?', [strtoupper($sample['brand'])])->orderBy('id')->first();
        $unit = UnitOfMeasure::query()->whereRaw('UPPER(name) = ?', [strtoupper($sample['unit'])])->orderBy('id')->first();
        $category = Category::query()->whereRaw('UPPER(name) = ?', [strtoupper($sample['category'])])->orderBy('id')->first();

        if (! $category && strtoupper($sample['category']) === 'CCTV') {
            $category = Category::query()->firstOrCreate(
                ['name' => 'CCTV'],
                [
                    'code' => 'CAT-CCTV',
                    'description' => 'CCTV accessories.',
                    'status' => 'active',
                ],
            );
        }

        if (! $brand || ! $unit || ! $category) {
            return;
        }

        $model = ProductModel::query()->firstOrCreate(
            [
                'brand_id' => $brand->id,
                'name' => $sample['model'],
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

        $item = Item::query()->updateOrCreate(
            ['item_name' => $sample['item_name']],
            [
                'item_code' => 'ITM-TMP-'.uniqid(),
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'model_id' => $model->id,
                'unit_of_measure_id' => $unit->id,
                'minimum_stock' => $sample['minimum_stock'],
                'stock_on_hand' => $sample['stock_on_hand'],
                'unit_price' => $sample['unit_price'],
                'status' => 'active',
            ],
        );

        $item->update([
            'item_code' => 'ITM-'.str_pad((string) $item->id, 4, '0', STR_PAD_LEFT),
            'barcode' => $item->barcode ?: '480'.str_pad((string) $item->id, 10, '0', STR_PAD_LEFT),
        ]);
    }

    protected function restoreA4BondPaper(): void
    {
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

        $item = Item::query()->updateOrCreate(
            ['item_name' => 'A4 Bond Paper'],
            [
                'item_code' => 'ITM-TMP-A4',
                'barcode' => '4801234567890',
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'model_id' => $model->id,
                'unit_of_measure_id' => $unit->id,
                'minimum_stock' => 5,
                'stock_on_hand' => 80,
                'unit_price' => 2500,
                'status' => 'active',
            ],
        );

        $item->update([
            'item_code' => 'ITM-'.str_pad((string) $item->id, 4, '0', STR_PAD_LEFT),
            'barcode' => $item->barcode ?: '4801234567890',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function upsertCustomer(array $data): void
    {
        $customer = Customer::query()->updateOrCreate(
            ['name' => $data['name']],
            [
                ...$data,
                'code' => 'CUST-TMP-'.uniqid(),
            ],
        );
        $customer->update([
            'code' => 'CUST-'.str_pad((string) $customer->id, 3, '0', STR_PAD_LEFT),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function upsertSupplier(array $data): void
    {
        $supplier = Supplier::query()->updateOrCreate(
            ['name' => $data['name']],
            [
                ...$data,
                'code' => 'SUP-TMP-'.uniqid(),
                'status' => 'active',
            ],
        );
        $supplier->update([
            ...$data,
            'code' => 'SUP-'.str_pad((string) $supplier->id, 3, '0', STR_PAD_LEFT),
            'status' => 'active',
        ]);
    }
};
