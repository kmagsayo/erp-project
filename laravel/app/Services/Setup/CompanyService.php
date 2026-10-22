<?php

namespace App\Services\Setup;

use App\Models\Company;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CompanyService
{
    use PaginatesSetupQueries;

    public function getCompanies(Request $request)
    {
        $query = Company::query()->orderBy('name');

        $this->applySearch($query, $request->query('search'), [
            'name',
            'address',
            'contact_number',
            'email',
            'registration_information',
        ]);

        if ($request->query('status') === 'inactive') {
            $query->whereRaw('1 = 0');
        }

        return $this->paginateQuery($query, $request);
    }

    public function getCompany(): ?Company
    {
        return Company::query()->orderBy('id')->first();
    }

    public function createCompany(array $data): Company
    {
        return Company::query()->create($data);
    }

    public function updateCompany(Company $company, array $data): Company
    {
        $company->update($data);

        return $company->fresh();
    }

    public function deleteCompany(Company $company): void
    {
        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }

        $company->delete();
    }

    public function uploadCompanyLogo(Company $company, UploadedFile $logo): Company
    {
        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }

        $path = $logo->store('setups/companies/logos', 'public');
        $company->update(['logo_path' => $path]);

        return $company->fresh();
    }
}
