<?php

namespace App\Services\Setup;

use App\Models\Branch;
use App\Models\Company;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class BranchService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getBranches(Request $request)
    {
        $query = Branch::query()->with('company')->orderBy('id');

        $this->applySearch($query, $request->query('search'), ['name', 'code', 'address']);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getBranchById(int $id): Branch
    {
        return Branch::query()->with('company')->findOrFail($id);
    }

    public function createBranch(array $data): Branch
    {
        $data = $this->fillFromCompany($data);
        $requestedCode = trim((string) ($data['code'] ?? ''));
        unset($data['code']);

        $branch = Branch::query()->create([
            ...$data,
            'code' => 'BR-TMP-'.uniqid(),
        ]);
        $branch->update([
            'code' => $requestedCode !== ''
                ? $requestedCode
                : $this->nextSequentialCode('branches', 'code', 'BR-', 3, $branch->id),
        ]);

        return $branch->fresh('company');
    }

    public function updateBranch(Branch $branch, array $data): Branch
    {
        $data = $this->fillFromCompany($data, $branch);
        unset($data['code']);
        $branch->update($data);

        return $branch->fresh('company');
    }

    public function deleteBranch(Branch $branch): void
    {
        $branch->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function fillFromCompany(array $data, ?Branch $branch = null): array
    {
        $companyId = $data['company_id'] ?? $branch?->company_id;
        $company = $companyId ? Company::query()->find($companyId) : null;
        if (! $company) {
            return $data;
        }

        $address = trim((string) ($data['address'] ?? ''));
        if ($address === '') {
            $data['address'] = trim((string) $company->address);
        }

        $contact = trim((string) ($data['contact_information'] ?? ''));
        if ($contact === '' && filled($company->contact_number)) {
            $data['contact_information'] = trim((string) $company->contact_number);
        }

        return $data;
    }
}
