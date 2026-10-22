<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\BrandRequest;
use App\Models\Brand;
use App\Services\Setup\BrandService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly BrandService $service) {}

    public function index(Request $request)
    {
        $brands = $this->service->getBrands($request);

        return ApiResponse::paginated($brands, 'brands', 'Brands retrieved successfully.');
    }

    public function store(BrandRequest $request)
    {
        $brand = $this->service->createBrand($request->validated());

        return ApiResponse::success(['brand' => $brand], 'Brand created successfully.', 201);
    }

    public function show(Brand $brand)
    {
        return ApiResponse::success(['brand' => $brand], 'Brand retrieved successfully.');
    }

    public function update(BrandRequest $request, Brand $brand)
    {
        $brand = $this->service->updateBrand($brand, $request->validated());

        return ApiResponse::success(['brand' => $brand], 'Brand updated successfully.');
    }

    public function destroy(Brand $brand)
    {
        return $this->runSetupAction(function () use ($brand) {
            $this->service->deleteBrand($brand);

            return ApiResponse::success(null, 'Brand deleted successfully.');
        });
    }
}
