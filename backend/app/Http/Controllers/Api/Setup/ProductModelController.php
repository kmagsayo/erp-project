<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\ProductModelRequest;
use App\Models\ProductModel;
use App\Services\Setup\ProductModelService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ProductModelController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly ProductModelService $service) {}

    public function index(Request $request)
    {
        $models = $this->service->getModels($request);

        return ApiResponse::paginated($models, 'models', 'Models retrieved successfully.');
    }

    public function byBrand(int $brandId, Request $request)
    {
        $models = $this->service->getModelsByBrand($brandId, $request);

        return ApiResponse::paginated($models, 'models', 'Models retrieved successfully.');
    }

    public function store(ProductModelRequest $request)
    {
        $model = $this->service->createModel($request->validated());

        return ApiResponse::success(['model' => $model], 'Model created successfully.', 201);
    }

    public function show(ProductModel $model)
    {
        $model = $this->service->getModelById($model->id);

        return ApiResponse::success(['model' => $model], 'Model retrieved successfully.');
    }

    public function update(ProductModelRequest $request, ProductModel $model)
    {
        $model = $this->service->updateModel($model, $request->validated());

        return ApiResponse::success(['model' => $model], 'Model updated successfully.');
    }

    public function destroy(ProductModel $model)
    {
        return $this->runSetupAction(function () use ($model) {
            $this->service->deleteModel($model);

            return ApiResponse::success(null, 'Model deleted successfully.');
        });
    }
}
