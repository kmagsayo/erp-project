<?php

namespace App\Services\Setup;

use App\Models\Supplier;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class SupplierService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getSuppliers(Request $request)
    {
        $query = Supplier::query()->orderBy('code');

        $this->applySearch($query, $request->query('search'), [
            'name',
            'code',
            'contact_person',
            'phone',
            'tin',
        ]);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getSupplierById(int $id): Supplier
    {
        return Supplier::query()->findOrFail($id);
    }

    public function createSupplier(array $data): Supplier
    {
        unset($data['code']);
        $supplier = Supplier::query()->create([
            ...$data,
            'code' => 'SUP-TMP-'.uniqid(),
        ]);
        $supplier->update([
            'code' => $this->nextSequentialCode('suppliers', 'code', 'SUP-', 3, $supplier->id),
        ]);

        return $supplier->fresh();
    }

    public function updateSupplier(Supplier $supplier, array $data): Supplier
    {
        unset($data['code']);
        $supplier->update($data);

        return $supplier->fresh();
    }

    public function deleteSupplier(Supplier $supplier): void
    {
        $supplier->delete();
    }
}
