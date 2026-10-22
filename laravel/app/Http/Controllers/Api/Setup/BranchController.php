<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\BranchRequest;
use App\Models\Branch;
use App\Services\Setup\BranchService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly BranchService $service) {}

    public function index(Request $request)
    {
        $branches = $this->service->getBranches($request);

        return ApiResponse::paginated($branches, 'branches', 'Branches retrieved successfully.');
    }

    public function store(BranchRequest $request)
    {
        $branch = $this->service->createBranch($request->validated());

        return ApiResponse::success(['branch' => $branch], 'Branch created successfully.', 201);
    }

    public function show(Branch $branch)
    {
        $branch->load('company');

        return ApiResponse::success(['branch' => $branch], 'Branch retrieved successfully.');
    }

    public function update(BranchRequest $request, Branch $branch)
    {
        $branch = $this->service->updateBranch($branch, $request->validated());

        return ApiResponse::success(['branch' => $branch], 'Branch updated successfully.');
    }

    public function destroy(Branch $branch)
    {
        return $this->runSetupAction(function () use ($branch) {
            $this->service->deleteBranch($branch);

            return ApiResponse::success(null, 'Branch deleted successfully.');
        });
    }
}
