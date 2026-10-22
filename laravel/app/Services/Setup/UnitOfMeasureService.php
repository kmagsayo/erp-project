<?php

namespace App\Services\Setup;

use App\Models\UnitOfMeasure;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class UnitOfMeasureService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getUnits(Request $request)
    {
        $query = UnitOfMeasure::query()->orderBy('id');

        $this->applySearch($query, $request->query('search'), ['name', 'code', 'symbol']);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getUnitById(int $id): UnitOfMeasure
    {
        return UnitOfMeasure::query()->findOrFail($id);
    }

    public function createUnit(array $data): UnitOfMeasure
    {
        unset($data['code']);
        $unit = UnitOfMeasure::query()->create([
            ...$data,
            'code' => 'UOM-TMP-'.uniqid(),
        ]);
        $unit->update([
            'code' => $this->nextSequentialCode('unit_of_measures', 'code', 'UOM-', 3, $unit->id),
        ]);

        return $unit->fresh();
    }

    public function updateUnit(UnitOfMeasure $unit, array $data): UnitOfMeasure
    {
        unset($data['code']);
        $unit->update($data);

        return $unit->fresh();
    }

    public function deleteUnit(UnitOfMeasure $unit): void
    {
        if ($unit->items()->exists()) {
            throw new \RuntimeException(
                'Cannot delete this unit of measure because it is currently being used by existing items.',
            );
        }

        $unit->delete();
    }
}
