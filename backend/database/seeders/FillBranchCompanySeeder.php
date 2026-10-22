<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class FillBranchCompanySeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasColumn('branches', 'company_id')) {
            return;
        }

        $companyByBranch = [
            'RTS-MAIN' => 'RESPONSIVCODE TECHNOLOGY SOLUTIONS',
            'RSC-MAIN' => 'RSC TECHNOLOGY AND DEVELOPMENT CORPORATION',
        ];

        foreach (Branch::query()->orderBy('id')->get() as $branch) {
            $company = $branch->company_id
                ? Company::query()->find($branch->company_id)
                : null;

            if (! $company && isset($companyByBranch[$branch->name])) {
                $company = Company::query()->where('name', $companyByBranch[$branch->name])->first();
            }

            if (! $company) {
                continue;
            }

            $address = trim((string) $company->address);
            if ($address !== (string) $company->address) {
                $company->update(['address' => $address]);
            }

            $updates = ['company_id' => $company->id];
            if (blank($branch->address) && $address !== '') {
                $updates['address'] = $address;
            }
            if (blank($branch->contact_information) && filled($company->contact_number)) {
                $updates['contact_information'] = trim((string) $company->contact_number);
            }

            $branch->update($updates);
        }
    }
}
