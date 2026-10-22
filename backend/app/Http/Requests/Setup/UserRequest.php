<?php

namespace App\Http\Requests\Setup;

use Illuminate\Validation\Rule;

class UserRequest extends SetupFormRequest
{
    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [$userId ? 'nullable' : 'required', 'string', 'min:6', 'confirmed'],
            'position_id' => ['nullable', 'integer', 'exists:positions,id'],
            'type' => ['nullable', 'string', 'in:admin,user'],
            'status' => $this->statusRule(),
        ];
    }
}
