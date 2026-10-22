<?php

namespace App\Services\Setup;

use App\Models\Position;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class PositionService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getPositions(Request $request)
    {
        $query = Position::query()->orderBy('name');

        $this->applySearch($query, $request->query('search'), ['name', 'code', 'description']);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getPositionById(int $id): Position
    {
        return Position::query()->findOrFail($id);
    }

    public function createPosition(array $data): Position
    {
        unset($data['code']);
        $position = Position::query()->create([
            ...$data,
            'code' => 'POS-TMP-'.uniqid(),
        ]);
        $position->update([
            'code' => $this->nextSequentialCode('positions', 'code', 'POS-', 3, $position->id),
        ]);

        return $position->fresh();
    }

    public function updatePosition(Position $position, array $data): Position
    {
        unset($data['code']);
        $position->update($data);

        return $position->fresh();
    }

    public function deletePosition(Position $position): void
    {
        $position->delete();
    }
}
