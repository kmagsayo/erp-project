<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\PositionRequest;
use App\Models\Position;
use App\Services\Setup\PositionService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly PositionService $service) {}

    public function index(Request $request)
    {
        $positions = $this->service->getPositions($request);

        return ApiResponse::paginated($positions, 'positions', 'Positions retrieved successfully.');
    }

    public function store(PositionRequest $request)
    {
        $position = $this->service->createPosition($request->validated());

        return ApiResponse::success(['position' => $position], 'Position created successfully.', 201);
    }

    public function show(Position $position)
    {
        return ApiResponse::success(['position' => $position], 'Position retrieved successfully.');
    }

    public function update(PositionRequest $request, Position $position)
    {
        $position = $this->service->updatePosition($position, $request->validated());

        return ApiResponse::success(['position' => $position], 'Position updated successfully.');
    }

    public function destroy(Position $position)
    {
        return $this->runSetupAction(function () use ($position) {
            $this->service->deletePosition($position);

            return ApiResponse::success(null, 'Position deleted successfully.');
        });
    }
}
