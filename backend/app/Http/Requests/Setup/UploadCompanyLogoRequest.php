<?php

namespace App\Http\Requests\Setup;

class UploadCompanyLogoRequest extends SetupFormRequest
{
    public function rules(): array
    {
        return [
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
