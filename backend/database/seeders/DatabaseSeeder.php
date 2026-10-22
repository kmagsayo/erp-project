<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(ImportRtsSystemSeeder::class);
        $this->call(FillBranchCompanySeeder::class);
        $this->call(CatalogItemsFromModelsSeeder::class);
        $this->call(RenumberSetupCodesSeeder::class);

        Setting::query()->firstOrCreate([], [
            'company_name' => 'RESPONSIVCODE TECHNOLOGY SOLUTIONS',
            'company_address' => 'RM301-E3 Medalle Bldg., Fuente Osmeña, Capitol Site, Cebu City 6000',
            'company_phone' => '09175734911',
            'company_email' => 'info@responsivcode.com',
            'user_name' => 'WEB ADMINISTRATOR',
            'user_email' => 'admin@responsivcode.com',
            'date_format' => 'F j, Y',
            'paper_size' => 'A4',
        ]);

        if (! User::query()->exists()) {
            User::query()->create([
                'name' => 'WEB ADMINISTRATOR',
                'username' => 'admin',
                'email' => 'admin@responsivcode.com',
                'password' => 'admin123',
                'type' => 'admin',
                'status' => 'active',
            ]);
        }
    }
}
