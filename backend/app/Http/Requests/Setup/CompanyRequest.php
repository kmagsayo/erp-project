<?php

namespace App\Http\Requests\Setup;

class CompanyRequest extends SetupFormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'registration_information' => ['nullable', 'string'],
        ];
    }
}
