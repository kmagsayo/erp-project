<?php

namespace App\Services\Setup;

use App\Models\Brand;
use App\Models\Item;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BrandService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getBrands(Request $request)
    {
        $query = Brand::query()->orderBy('id');

        $this->applySearch($query, $request->query('search'), ['name', 'code', 'description']);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getBrandById(int $id): Brand
    {
        return Brand::query()->findOrFail($id);
    }

    public function createBrand(array $data): Brand
    {
        unset($data['code']);
        $brand = Brand::query()->create([
            ...$data,
            'code' => 'BRD-TMP-'.uniqid(),
        ]);
        $brand->update([
            'code' => $this->nextSequentialCode('brands', 'code', 'BRD-', 3, $brand->id),
        ]);

        return $brand->fresh();
    }

    public function updateBrand(Brand $brand, array $data): Brand
    {
        unset($data['code']);
        $brand->update($data);

        return $brand->fresh();
    }

    public function deleteBrand(Brand $brand): void
    {
        DB::transaction(function () use ($brand) {
            $modelIds = $brand->productModels()->pluck('id');

            Item::query()->where('brand_id', $brand->id)->delete();

            if ($modelIds->isNotEmpty()) {
                Item::query()->whereIn('model_id', $modelIds)->delete();
            }

            $brand->productModels()->delete();
            $brand->delete();
        });
    }
}
