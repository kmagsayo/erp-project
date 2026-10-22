<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\SupplierRequest;
use App\Models\Supplier;
use App\Services\Setup\SupplierService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly SupplierService $service) {}

    public function index(Request $request)
    {
        $suppliers = $this->service->getSuppliers($request);

        return ApiResponse::paginated($suppliers, 'suppliers', 'Suppliers retrieved successfully.');
    }

    public function store(SupplierRequest $request)
    {
        $supplier = $this->service->createSupplier($request->validated());

        return ApiResponse::success(['supplier' => $supplier], 'Supplier created successfully.', 201);
    }

    public function show(Supplier $supplier)
    {
        return ApiResponse::success(['supplier' => $supplier], 'Supplier retrieved successfully.');
    }

    public function update(SupplierRequest $request, Supplier $supplier)
    {
        $supplier = $this->service->updateSupplier($supplier, $request->validated());

        return ApiResponse::success(['supplier' => $supplier], 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        return $this->runSetupAction(function () use ($supplier) {
            $this->service->deleteSupplier($supplier);

            return ApiResponse::success(null, 'Supplier deleted successfully.');
        });
    }
}
