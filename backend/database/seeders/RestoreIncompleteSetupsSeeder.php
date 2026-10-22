<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Item;
use App\Models\ProductModel;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\UnitOfMeasure;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RestoreIncompleteSetupsSeeder extends Seeder
{

    public function run(): void
    {
        $this->restoreCustomers();
        $this->restoreSuppliers();
        $this->restoreItemsFromModels();
        $this->restoreProject();
    }

    protected function restoreCustomers(): void
    {
        $samples = [
            [
                'name' => 'Metro Pacific Retail Corp.',
                'phone' => '09171112222',
                'address' => '5th Ave, Bonifacio Global City, Taguig',
                'tin' => '000-111-222-000',
                'terms' => 30,
                'terms_type' => 'IN DAYS',
                'contact_person' => 'Procurement Desk',
            ],
            [
                'name' => "St. Luke's Medical Center",
                'phone' => '09173334444',
                'address' => '279 E Rodriguez Sr. Ave, Quezon City',
                'tin' => '000-333-444-000',
                'terms' => 15,
                'terms_type' => 'IN DAYS',
                'contact_person' => 'Purchasing Department',
            ],
            [
                'name' => 'ABC Corporation',
                'phone' => '09171234567',
                'address' => '123 Example Street, Cebu City',
                'tin' => '000-555-666-000',
                'terms' => 30,
                'terms_type' => 'IN DAYS',
                'contact_person' => 'Juan Dela Cruz',
            ],
            [
                'name' => 'XYZ Industries',
                'phone' => '09182345678',
                'address' => 'Mandaue City, Cebu',
                'tin' => '000-777-888-000',
                'terms' => 45,
                'terms_type' => 'IN DAYS',
                'contact_person' => 'Maria Santos',
            ],
            [
                'name' => 'Global Tech Inc.',
                'phone' => '09193456789',
                'address' => 'Cebu IT Park, Lahug, Cebu City',
                'tin' => '000-999-000-000',
                'terms' => 15,
                'terms_type' => 'IN DAYS',
                'contact_person' => 'Carlos Tan',
            ],
        ];

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
                    'contact_person' => null,
                    'status' => strtolower((string) $row->status) === 'inactive' ? 'inactive' : 'active',
                ]);
            }
        }

        foreach ($samples as $sample) {
            $this->upsertCustomer($sample + ['status' => 'active']);
        }
    }

    protected function restoreSuppliers(): void
    {
        $samples = [
            [
                'name' => 'Hikvision Philippines, Inc.',
                'contact_person' => 'Ana Cruz',
                'phone' => '09171234567',
                'address' => 'Ortigas Center, Pasig City',
                'tin' => '009-876-543-000',
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
            [
                'name' => 'TechSource Trading',
                'contact_person' => 'Rico Mendoza',
                'phone' => '09226789012',
                'address' => 'Cebu City',
                'tin' => '901-234-567-000',
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
            $this->upsertSupplier($sample);
        }
    }

    protected function restoreItemsFromModels(): void
    {
        $unit = UnitOfMeasure::query()->whereRaw('UPPER(name) = ?', ['UNIT'])->orderBy('id')->first()
            ?? UnitOfMeasure::query()->orderBy('id')->first();
        if (! $unit) {
            return;
        }

        $categories = Category::query()->get()->keyBy(fn (Category $category) => strtoupper((string) $category->name));
        $fallbackCategory = $categories->first();
        if (! $fallbackCategory) {
            return;
        }

        $usedModelIds = Item::query()->pluck('model_id')->filter()->map(fn ($id) => (int) $id)->all();

        foreach (ProductModel::query()->with('brand')->orderBy('id')->get() as $model) {
            if (in_array((int) $model->id, $usedModelIds, true)) {
                continue;
            }

            $itemName = trim((string) $model->name);
            if ($itemName === '') {
                continue;
            }

            $category = $this->categoryForModel($itemName, $categories) ?? $fallbackCategory;
            $item = Item::query()->create([
                'item_code' => 'ITM-TMP-'.$model->id.'-'.uniqid(),
                'item_name' => $itemName,
                'category_id' => $category->id,
                'brand_id' => $model->brand_id,
                'model_id' => $model->id,
                'unit_of_measure_id' => $unit->id,
                'minimum_stock' => 2,
                'stock_on_hand' => 10,
                'unit_price' => 0,
                'status' => $model->status === 'inactive' ? 'inactive' : 'active',
            ]);

            $item->update([
                'item_code' => $this->nextSequentialCode('items', 'item_code', 'ITM-', 4, $item->id),
                'barcode' => '480'.str_pad((string) $item->id, 10, '0', STR_PAD_LEFT),
            ]);
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<string, Category>  $categories
     */
    protected function categoryForModel(string $modelName, $categories): ?Category
    {
        $name = strtoupper($modelName);

        if (str_contains($name, 'NVR')) {
            return $categories->get('NVR');
        }
        if (str_contains($name, 'XVR') || str_contains($name, 'HGHI') || str_contains($name, 'DVR')) {
            return $categories->get('DVR');
        }
        if (
            str_contains($name, 'PFS')
            || str_contains($name, '3E')
            || str_contains($name, '3WR')
            || str_contains($name, 'CS4006')
            || str_contains($name, 'CHS-')
            || str_contains($name, 'SWITCH')
        ) {
            return $categories->get('SWITCHES/ROUTER');
        }
        if (str_contains($name, 'HAC') || str_contains($name, 'CE16') || str_contains($name, 'CE72') || str_contains($name, 'CE76')) {
            return $categories->get('ANALOG CAMERA');
        }

        return $categories->get('IP CAMERA');
    }

    protected function restoreProject(): void
    {
        $fallbackCustomerId = Customer::query()->value('id');
        if (! $fallbackCustomerId) {
            return;
        }

        if (Schema::hasTable('setup_project')) {
            foreach (DB::table('setup_project')->orderBy('id')->get() as $row) {
                if (Project::query()->where('project_name', $row->name)->exists()) {
                    continue;
                }

                Project::query()->create([
                    'project_code' => $this->nextSequentialCode('projects', 'project_code', 'PRJ-', 3),
                    'project_name' => $row->name,
                    'customer_id' => $fallbackCustomerId,
                    'location' => $row->address ?? null,
                    'status' => strtolower((string) $row->status) === 'inactive' ? 'inactive' : 'active',
                ]);
            }
        }

        if (! Project::query()->where('project_name', 'Project ABC')->exists()) {
            Project::query()->create([
                'project_code' => $this->nextSequentialCode('projects', 'project_code', 'PRJ-', 3),
                'project_name' => 'Project ABC',
                'customer_id' => Customer::query()->where('name', 'ABC Corporation')->value('id') ?: $fallbackCustomerId,
                'location' => 'Cebu City',
                'status' => 'active',
                'remarks' => 'Sample project for ERP setup.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function upsertCustomer(array $data): void
    {
        $customer = Customer::query()->where('name', $data['name'])->first();
        if ($customer) {
            $customer->update(collect($data)->except('code')->all());

            return;
        }

        $customer = Customer::query()->create([
            ...$data,
            'code' => 'CUST-TMP-'.uniqid(),
            'status' => $data['status'] ?? 'active',
        ]);
        $customer->update([
            'code' => $this->nextSequentialCode('customers', 'code', 'CUST-', 3, $customer->id),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function upsertSupplier(array $data): void
    {
        $supplier = Supplier::query()->where('name', $data['name'])->first();
        if ($supplier) {
            $supplier->update(collect($data)->except('code')->all());

            return;
        }

        $supplier = Supplier::query()->create([
            ...$data,
            'code' => 'SUP-TMP-'.uniqid(),
            'status' => 'active',
        ]);
        $supplier->update([
            'code' => $this->nextSequentialCode('suppliers', 'code', 'SUP-', 3, $supplier->id),
        ]);
    }

    protected function nextSequentialCode(
        string $table,
        string $column,
        string $prefix,
        int $pad,
        ?int $ignoreId = null,
    ): string {
        $query = DB::table($table)->where($column, 'like', $prefix.'%');
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $max = 0;
        foreach ($query->pluck($column) as $code) {
            $suffix = substr((string) $code, strlen($prefix));
            if (ctype_digit($suffix)) {
                $max = max($max, (int) $suffix);
            }
        }

        return $prefix.str_pad((string) ($max + 1), $pad, '0', STR_PAD_LEFT);
    }
}
