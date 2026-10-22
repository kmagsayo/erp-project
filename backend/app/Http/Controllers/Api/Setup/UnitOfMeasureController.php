<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\UnitOfMeasureRequest;
use App\Models\UnitOfMeasure;
use App\Services\Setup\UnitOfMeasureService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class UnitOfMeasureController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly UnitOfMeasureService $service) {}

    public function index(Request $request)
    {
        $units = $this->service->getUnits($request);

        return ApiResponse::paginated($units, 'units', 'Units retrieved successfully.');
    }

    public function store(UnitOfMeasureRequest $request)
    {
        $unit = $this->service->createUnit($request->validated());

        return ApiResponse::success(['unit' => $unit], 'Unit of measure created successfully.', 201);
    }

    public function show(UnitOfMeasure $unit)
    {
        return ApiResponse::success(['unit' => $unit], 'Unit of measure retrieved successfully.');
    }

    public function update(UnitOfMeasureRequest $request, UnitOfMeasure $unit)
    {
        $unit = $this->service->updateUnit($unit, $request->validated());

        return ApiResponse::success(['unit' => $unit], 'Unit of measure updated successfully.');
    }

    public function destroy(UnitOfMeasure $unit)
    {
        return $this->runSetupAction(function () use ($unit) {
            $this->service->deleteUnit($unit);

            return ApiResponse::success(null, 'Unit of measure deleted successfully.');
        });
    }
}
