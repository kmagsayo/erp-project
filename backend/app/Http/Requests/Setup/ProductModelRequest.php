<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class ProductModelRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $modelId = $this->route('model');

        return [
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_models', 'name')
                    ->where(fn ($query) => $query->where('brand_id', $this->input('brand_id')))
                    ->ignore($modelId),
            ],
            'code' => ['nullable', 'string', 'max:50'],
            'status' => $this->statusRule(),
        ];
    }
}
