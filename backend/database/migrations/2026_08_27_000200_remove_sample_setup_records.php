<?php

use App\Models\Customer;
use App\Models\Item;
use App\Models\Project;
use App\Models\Supplier;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Project::query()
            ->where('project_code', 'PRJ-001')
            ->orWhere('project_name', 'Project ABC')
            ->orWhere('remarks', 'Sample project for ERP setup.')
            ->delete();

        Item::query()
            ->whereIn('item_code', [
                'ITM-0001',
                'ITM-0002',
                'ITM-0003',
                'ITM-0004',
                'ITM-0005',
                'ITM-0006',
                'ITM-0007',
                'ITM-TMP-A4',
            ])
            ->orWhereIn('item_name', [
                'IP Camera',
                'Indoor IP Camera',
                'Hikvision 4MP Dome Camera',
                'Dahua 8-Channel NVR',
                'Hikvision 4K PTZ Camera',
                'Samsung 1TB Surveillance HDD',
                'Cat6 UTP Cable 305m Box',
                '12V 5A Power Adapter',
                'A4 Bond Paper',
            ])
            ->orWhere('barcode', '4801234567890')
            ->delete();

        Customer::query()
            ->whereIn('name', [
                'ABC Corporation',
                'XYZ Industries',
                'Global Tech Inc.',
            ])
            ->orWhere('address', '123 Example Street, Cebu City')
            ->delete();

        Supplier::query()
            ->whereIn('name', [
                'TechSource Trading',
                'Hikvision Philippines, Inc.',
                'Dahua Technology Philippines, Inc.',
                'Bosch Security Systems PH',
                'Cebu Industrial Trading',
                'Network Cable Trading',
            ])
            ->delete();
    }

    public function down(): void
    {
        // Sample records are not restored.
    }
};
