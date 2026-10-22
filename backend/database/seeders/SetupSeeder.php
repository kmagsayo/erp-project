<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Position;
use Illuminate\Database\Seeder;

class SetupSeeder extends Seeder
{
    public function run(): void
    {
        Company::query()->firstOrCreate([], [
            'name' => 'RESPONSIVCODE TECHNOLOGY SOLUTIONS',
            'address' => 'RM301-E3 Medalle Bldg., Fuente Osmeña, Capitol Site, Cebu City 6000',
            'contact_number' => '09175734911',
            'email' => 'info@responsivcode.com',
            'registration_information' => null,
        ]);

        Position::query()->firstOrCreate(
            ['code' => 'POS-001'],
            [
                'name' => 'System Administrator',
                'description' => 'Manages ERP users and settings.',
                'status' => 'active',
            ],
        );
    }
}
