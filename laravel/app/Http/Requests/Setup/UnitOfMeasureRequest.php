<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class UnitOfMeasureRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $unitId = $this->route('unit');

        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('unit_of_measures', 'code')->ignore($unitId),
            ],
            'symbol' => ['nullable', 'string', 'max:20'],
            'status' => $this->statusRule(),
        ];
    }
}
