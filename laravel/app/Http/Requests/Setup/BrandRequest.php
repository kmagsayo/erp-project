<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class BrandRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $brandId = $this->route('brand');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('brands', 'code')->ignore($brandId),
            ],
            'description' => ['nullable', 'string'],
            'status' => $this->statusRule(),
        ];
    }
}
