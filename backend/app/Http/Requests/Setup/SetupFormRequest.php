<?php

namespace App\Http\Requests\Setup;

use Illuminate\Foundation\Http\FormRequest;

abstract class SetupFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function statusRule(): array
    {
        return ['nullable', 'string', 'in:active,inactive'];
    }
}
