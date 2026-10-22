<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SettingController extends Controller
{
    public function show()
    {
        $setting = Setting::query()->first();

        if (! $setting) {
            $setting = Setting::query()->create([
                'company_name' => 'RESPONSIVCODE TECHNOLOGY SOLUTIONS',
                'company_address' => 'RM301-E3 Medalle Bldg., Fuente Osmeña, Capitol Site, Cebu City 6000',
                'company_phone' => '09175734911',
                'company_email' => 'info@responsivcode.com',
                'user_name' => 'Admin',
                'user_email' => 'admin@responsivcode.com',
                'date_format' => 'F j, Y',
                'paper_size' => 'A4',
            ]);
        }

        return response()->json($setting);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'company_address' => ['nullable', 'string'],
            'company_phone' => ['nullable', 'string', 'max:100'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'user_name' => ['nullable', 'string', 'max:255'],
            'user_email' => ['nullable', 'email', 'max:255'],
            'date_format' => ['required', 'string', 'max:50'],
            'paper_size' => ['required', 'in:A4,Letter,Legal'],
        ]);

        $setting = Setting::query()->first();

        if ($setting) {
            $setting->update($data);
        } else {
            $setting = Setting::query()->create($data);
        }

        $user = $request->user();
        if ($user) {
            $user->fill([
                'name' => $data['user_name'] ?? $user->name,
                'email' => $data['user_email'] ?? $user->email,
            ])->save();
        }

        return response()->json([
            'message' => 'Settings saved.',
            'data' => $setting,
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Log in to Laravel before changing the password.',
            ], 401);
        }

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json([
            'message' => 'Password updated.',
        ]);
    }
}
