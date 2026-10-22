<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ResetAdminPasswordSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->where('username', 'admin')->first();

        if (! $user) {
            $this->command?->warn('Admin user not found.');

            return;
        }

        $user->password = 'admin123';
        $user->save();

        $this->command?->info(
            Hash::check('admin123', $user->fresh()->password)
                ? 'Admin password reset to admin123.'
                : 'Admin password reset failed.',
        );
    }
}
