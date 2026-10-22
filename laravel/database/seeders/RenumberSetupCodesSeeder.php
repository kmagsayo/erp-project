<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\UnitOfMeasure;
use Illuminate\Database\Seeder;

class RenumberSetupCodesSeeder extends Seeder
{
    public function run(): void
    {
        $this->renumber(Category::query()->orderBy('id')->get(), 'code', 'CAT-', 3);
        $this->renumber(Brand::query()->orderBy('id')->get(), 'code', 'BRD-', 3);
        $this->renumber(UnitOfMeasure::query()->orderBy('id')->get(), 'code', 'UOM-', 3);
        $this->renumber(Item::query()->orderBy('id')->get(), 'item_code', 'ITM-', 4);
        $this->renumber(Supplier::query()->orderBy('id')->get(), 'code', 'SUP-', 3);
        $this->renumber(Customer::query()->orderBy('id')->get(), 'code', 'CUST-', 3);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \Illuminate\Database\Eloquent\Model>  $rows
     */
    protected function renumber($rows, string $column, string $prefix, int $pad): void
    {
        $expected = [];
        foreach ($rows->values() as $index => $row) {
            $expected[$row->getKey()] = $prefix.str_pad((string) ($index + 1), $pad, '0', STR_PAD_LEFT);
        }

        $alreadySequential = $rows->every(
            fn ($row) => $row->{$column} === $expected[$row->getKey()],
        );
        if ($alreadySequential) {
            return;
        }

        foreach ($rows->values() as $index => $row) {
            $row->update([$column => $prefix.'TMP-'.($index + 1)]);
        }

        foreach ($rows->values() as $index => $row) {
            $row->refresh();
            $row->update([
                $column => $prefix.str_pad((string) ($index + 1), $pad, '0', STR_PAD_LEFT),
            ]);
        }
    }
}
