<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class ItemRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $itemId = $this->route('item');

        return [
            'item_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('items', 'item_code')->ignore($itemId),
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('items', 'barcode')->ignore($itemId),
            ],
            'requires_serial' => ['nullable', 'boolean'],
            'item_name' => ['required', 'string', 'max:255'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'model_id' => ['required', 'integer', 'exists:product_models,id'],
            'unit_of_measure_id' => ['required', 'integer', 'exists:unit_of_measures,id'],
            'description' => ['nullable', 'string'],
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'stock_on_hand' => ['nullable', 'integer', 'min:0'],
            'status' => $this->statusRule(),
        ];
    }
}
