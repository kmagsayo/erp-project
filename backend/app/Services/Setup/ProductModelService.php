<?php

namespace App\Services\Setup;

use App\Models\Brand;
use App\Models\ProductModel;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class ProductModelService
{
    use PaginatesSetupQueries;

    public function getModels(Request $request)
    {
        $query = ProductModel::query()->with('brand')->orderBy('name');

        if ($brandId = $request->query('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        $this->applySearch($query, $request->query('search'), ['name', 'code']);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getModelsByBrand(int $brandId, Request $request)
    {
        Brand::query()->findOrFail($brandId);

        $request->merge(['brand_id' => $brandId]);

        return $this->getModels($request);
    }

    public function getModelById(int $id): ProductModel
    {
        return ProductModel::query()->with('brand')->findOrFail($id);
    }

    public function createModel(array $data): ProductModel
    {
        $model = ProductModel::query()->create($data);

        return $model->load('brand');
    }

    public function updateModel(ProductModel $model, array $data): ProductModel
    {
        $model->update($data);

        return $model->fresh(['brand']);
    }

    public function deleteModel(ProductModel $model): void
    {
        if ($model->items()->exists()) {
            throw new \RuntimeException(
                'Cannot delete this model because it is currently being used by existing items.',
            );
        }

        $model->delete();
    }
}
