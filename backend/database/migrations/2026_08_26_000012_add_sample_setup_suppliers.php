<?php

use App\Models\Supplier;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $samples = [
            [
                'name' => 'Hikvision Philippines, Inc.',
                'contact_person' => 'Ana Cruz',
                'phone' => '09171234567',
                'address' => 'Cebu IT Park, Lahug, Cebu City',
                'tin' => '456-789-012-000',
            ],
            [
                'name' => 'Dahua Technology Philippines, Inc.',
                'contact_person' => 'Mark Reyes',
                'phone' => '09182345678',
                'address' => 'Mandaue City, Cebu',
                'tin' => '567-890-123-000',
            ],
            [
                'name' => 'Bosch Security Systems PH',
                'contact_person' => 'Lara Tan',
                'phone' => '09193456789',
                'address' => 'Cebu Business Park, Cebu City',
                'tin' => '678-901-234-000',
            ],
            [
                'name' => 'Cebu Industrial Trading',
                'contact_person' => 'Paolo Lim',
                'phone' => '09204567890',
                'address' => 'Mandaue City, Cebu',
                'tin' => '789-012-345-000',
            ],
            [
                'name' => 'Network Cable Trading',
                'contact_person' => 'Nina Uy',
                'phone' => '09215678901',
                'address' => 'Fuente Osmeña, Cebu City',
                'tin' => '890-123-456-000',
            ],
        ];

        foreach ($samples as $sample) {
            $supplier = Supplier::query()->firstOrCreate(
                ['name' => $sample['name']],
                [
                    ...$sample,
                    'code' => 'SUP-TMP-'.uniqid(),
                    'status' => 'active',
                ],
            );

            $supplier->update([
                ...$sample,
                'code' => 'SUP-'.str_pad((string) $supplier->id, 3, '0', STR_PAD_LEFT),
                'status' => 'active',
            ]);
        }
    }

    public function down(): void
    {
        Supplier::query()->whereIn('name', [
            'Hikvision Philippines, Inc.',
            'Dahua Technology Philippines, Inc.',
            'Bosch Security Systems PH',
            'Cebu Industrial Trading',
            'Network Cable Trading',
        ])->delete();
    }
};
