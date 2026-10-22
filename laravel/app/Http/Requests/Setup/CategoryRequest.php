<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class CategoryRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $categoryId = $this->route('category');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('categories', 'code')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'status' => $this->statusRule(),
        ];
    }
}
