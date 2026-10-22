<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class PositionRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $positionId = $this->route('position');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('positions', 'code')->ignore($positionId),
            ],
            'description' => ['nullable', 'string'],
            'status' => $this->statusRule(),
        ];
    }
}
