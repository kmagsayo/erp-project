<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Item;
use App\Models\Position;
use App\Models\ProductModel;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\UnitOfMeasure;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ImportRtsSystemSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('setup_company')) {
            $this->command?->line('No legacy setup tables were found. The local database was left unchanged.');

            return;
        }

        $this->importCompanies();
        $this->importNamedSetups('setup_branch', function (object $row) {
            $company = Company::query()->find($row->company_id);

            return [
                'company_id' => $company?->id,
                'name' => $row->name,
                'code' => $this->uniqueCode('BR', $row->id, $row->name),
                'address' => $company ? trim((string) $company->address) : null,
                'contact_information' => $company?->contact_number,
                'status' => $this->status($row->status),
            ];
        }, new Branch);
        $this->importNamedSetups('setup_brand', fn (object $row) => [
            'name' => $row->name,
            'code' => $this->uniqueCode('BRD', $row->id, $row->name),
            'description' => null,
            'status' => $this->status($row->status),
        ], new Brand);
        $this->importNamedSetups('setup_category', fn (object $row) => [
            'name' => $row->name,
            'code' => $this->uniqueCode('CAT', $row->id, $row->name),
            'description' => null,
            'status' => $this->status($row->status),
        ], new Category);
        $this->importNamedSetups('setup_position', fn (object $row) => [
            'name' => $row->name,
            'code' => $this->uniqueCode('POS', $row->id, $row->name),
            'description' => null,
            'status' => $this->status($row->status),
        ], new Position);
        $this->importNamedSetups('setup_unit_measure', fn (object $row) => [
            'name' => $row->name,
            'code' => $this->uniqueCode('UOM', $row->id, $row->name),
            'symbol' => $row->name,
            'status' => $this->status($row->status),
        ], new UnitOfMeasure);
        $this->importModels();
        $this->importCustomers();
        $this->importSuppliers();
        $this->importItems();
        $this->importProjects();
        $this->importUsers();
    }

    protected function importCompanies(): void
    {
        foreach (DB::table('setup_company')->orderBy('id')->get() as $row) {
            Company::query()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'address' => $row->address,
                    'contact_number' => $row->contact_no,
                    'email' => null,
                    'logo_path' => null,
                    'registration_information' => $row->tin_no,
                    'created_at' => $row->date_created,
                    'updated_at' => $row->date_created,
                ],
            );
        }
    }

    protected function importNamedSetups(string $sourceTable, callable $map, $model): void
    {
        $class = $model::class;

        foreach (DB::table($sourceTable)->orderBy('id')->get() as $row) {
            $class::query()->updateOrCreate(['id' => $row->id], [
                ...$map($row),
                'created_at' => $row->date_created,
                'updated_at' => $row->date_created,
            ]);
        }
    }

    protected function importModels(): void
    {
        foreach (DB::table('setup_model')->orderBy('id')->get() as $row) {
            $name = (string) $row->name;
            $alreadyUsed = ProductModel::query()
                ->where('brand_id', $row->brand_id)
                ->where('name', $name)
                ->where('id', '!=', $row->id)
                ->exists();

            if ($alreadyUsed) {
                $name = $name.' #'.$row->id;
            }

            ProductModel::query()->updateOrCreate(
                ['id' => $row->id],
                [
                    'brand_id' => $row->brand_id,
                    'name' => $name,
                    'code' => $row->name,
                    'status' => $this->status($row->status),
                    'created_at' => $row->date_created,
                    'updated_at' => $row->date_created,
                ],
            );
        }
    }

    protected function importCustomers(): void
    {
        foreach (DB::table('setup_customer')->orderBy('id')->get() as $row) {
            Customer::query()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'code' => $this->uniqueCode('CUST', $row->id, $row->name),
                    'contact_person' => null,
                    'email' => null,
                    'phone' => null,
                    'address' => $row->address,
                    'status' => $this->status($row->status),
                    'created_at' => $row->date_created,
                    'updated_at' => $row->date_created,
                ],
            );
        }
    }

    protected function importSuppliers(): void
    {
        foreach (DB::table('setup_supplier')->orderBy('id')->get() as $row) {
            Supplier::query()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'code' => $this->uniqueCode('SUP', $row->id, $row->name),
                    'contact_person' => $row->contact_person,
                    'email' => null,
                    'phone' => $row->contact_person_no,
                    'address' => $row->address,
                    'status' => $this->status($row->status),
                    'created_at' => $row->date_created,
                    'updated_at' => $row->date_created,
                ],
            );
        }
    }

    protected function importItems(): void
    {
        $fallbackCategoryId = Category::query()->value('id');
        $fallbackUnitId = UnitOfMeasure::query()->value('id');

        foreach (DB::table('setup_items')->orderBy('id')->get() as $row) {
            Item::query()->updateOrCreate(
                ['id' => $row->id],
                [
                    'item_code' => $this->uniqueCode('ITM', $row->id, $row->item_name),
                    'item_name' => $row->item_name,
                    'category_id' => $fallbackCategoryId,
                    'brand_id' => $row->brand_id,
                    'model_id' => $row->model_id,
                    'unit_of_measure_id' => $row->unit_measure_id ?: $fallbackUnitId,
                    'description' => null,
                    'minimum_stock' => 0,
                    'status' => $this->status($row->status),
                    'created_at' => $row->date_created,
                    'updated_at' => $row->date_created,
                ],
            );
        }
    }

    protected function importProjects(): void
    {
        $fallbackCustomerId = Customer::query()->value('id');

        foreach (DB::table('setup_project')->orderBy('id')->get() as $row) {
            if (! $fallbackCustomerId) {
                continue;
            }

            Project::query()->updateOrCreate(
                ['id' => $row->id],
                [
                    'project_code' => $this->uniqueCode('PRJ', $row->id, $row->name),
                    'project_name' => $row->name,
                    'customer_id' => $fallbackCustomerId,
                    'location' => $row->address,
                    'start_date' => null,
                    'end_date' => null,
                    'status' => $this->status($row->status),
                    'remarks' => null,
                    'created_at' => $row->date_created,
                    'updated_at' => $row->date_created,
                ],
            );
        }
    }

    protected function importUsers(): void
    {
        foreach (DB::table('setup_users')->orderBy('id')->get() as $row) {
            $username = strtolower((string) $row->username);
            $email = $username === 'admin'
                ? 'admin@responsivcode.com'
                : $username.'@responsivcode.com';

            User::query()->updateOrCreate(
                ['username' => $username],
                [
                    'name' => $row->name,
                    'email' => $email,
                    'password' => (string) $row->password,
                    'position_id' => $row->position_id ?: null,
                    'type' => strtolower((string) $row->type) === 'admin' ? 'admin' : 'user',
                    'status' => $this->status($row->status),
                ],
            );
        }
    }

    protected function status(?string $status): string
    {
        return strtolower((string) $status) === 'inactive' ? 'inactive' : 'active';
    }

    protected function uniqueCode(string $prefix, int $id, ?string $name): string
    {
        $slug = strtoupper(Str::slug((string) $name, '-'));

        if ($slug === '') {
            return sprintf('%s-%03d', $prefix, $id);
        }

        return sprintf('%s-%03d-%s', $prefix, $id, substr($slug, 0, 24));
    }
};
