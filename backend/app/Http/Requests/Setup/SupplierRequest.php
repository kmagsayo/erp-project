<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class SupplierRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $supplierId = $this->route('supplier');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('suppliers', 'code')->ignore($supplierId),
            ],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'tin' => ['nullable', 'string', 'max:50'],
            'status' => $this->statusRule(),
        ];
    }
}
