<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\ProductModel;
use App\Models\UnitOfMeasure;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        ProductModel::query()
            ->whereIn('name', [
                'DS-2CD2143G2-I',
                'DHI-NVR4108HS',
                'DS-2DF4A425IW-DF',
                'ST1000VX013',
                'CAT6-UTP-305',
                'PWR-12V5A',
                'A4 70GSM',
                'DS-2CD1023',
            ])
            ->delete();

        Brand::query()->where('code', 'BRD-GEN')->orWhere('name', 'GENERIC')->delete();
        Category::query()->whereIn('code', ['CAT-OFFICE', 'CAT-CCTV'])->delete();
        UnitOfMeasure::query()->where('code', 'REAM')->orWhere('name', 'REAM')->delete();
        User::query()->where('email', 'testuser@responsivcode.com')->delete();
    }

    public function down(): void
    {
        // Sample records are not restored.
    }
};
