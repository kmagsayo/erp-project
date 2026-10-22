<?php

use App\Models\Item;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $prices = [
            'ITM-0001' => ['name' => 'Hikvision 4MP Dome Camera', 'price' => 5000],
            'ITM-0002' => ['name' => 'Dahua 8-Channel NVR', 'price' => 18000],
            'ITM-0003' => ['name' => 'Hikvision 4K PTZ Camera', 'price' => 22000],
            'ITM-0004' => ['name' => 'Samsung 1TB Surveillance HDD', 'price' => 4500],
            'ITM-0005' => ['name' => 'Cat6 UTP Cable 305m Box', 'price' => 3000],
            'ITM-0006' => ['name' => '12V 5A Power Adapter', 'price' => 450],
            'ITM-0007' => ['name' => 'A4 Bond Paper', 'price' => 2500],
        ];

        foreach ($prices as $itemCode => $row) {
            Item::query()
                ->where(function ($query) use ($itemCode, $row) {
                    $query->where('item_code', $itemCode)
                        ->orWhere('item_name', $row['name']);
                })
                ->where(function ($query) {
                    $query->whereNull('unit_price')->orWhere('unit_price', 0);
                })
                ->update(['unit_price' => $row['price']]);
        }
    }

    public function down(): void
    {
        Item::query()
            ->whereIn('item_code', [
                'ITM-0001',
                'ITM-0002',
                'ITM-0003',
                'ITM-0004',
                'ITM-0005',
                'ITM-0006',
                'ITM-0007',
            ])
            ->orWhereIn('item_name', [
                'Hikvision 4MP Dome Camera',
                'Dahua 8-Channel NVR',
                'Hikvision 4K PTZ Camera',
                'Samsung 1TB Surveillance HDD',
                'Cat6 UTP Cable 305m Box',
                '12V 5A Power Adapter',
                'A4 Bond Paper',
            ])
            ->update(['unit_price' => 0]);
    }
};
