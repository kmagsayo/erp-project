<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class BranchRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $branchId = $this->route('branch');

        return [
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('branches', 'code')->ignore($branchId),
            ],
            'address' => ['nullable', 'string'],
            'contact_information' => ['nullable', 'string', 'max:255'],
            'status' => $this->statusRule(),
        ];
    }
}
