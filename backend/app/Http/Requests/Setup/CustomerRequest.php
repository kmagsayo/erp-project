<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class CustomerRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $customerId = $this->route('customer');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'code')->ignore($customerId),
            ],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:100'],
            'tin' => ['nullable', 'string', 'max:50'],
            'terms' => ['nullable', 'integer', 'min:0'],
            'terms_type' => ['nullable', 'string', 'max:20'],
            'status' => $this->statusRule(),
        ];
    }
}
