<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryItemScanTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.connections.sqlite.database') !== ':memory:') {
            $this->fail('Refusing to run against the local database file.');
        }
    }

    public function test_delivery_item_qr_is_stored_for_the_open_receipt(): void
    {
        $this->get('/api/r?c='.urlencode('DRITEM:DR-000001:item-1'))
            ->assertOk();

        $this->assertDatabaseHas('receiving_scans', [
            'code' => 'DRITEM:DR-000001:item-1',
        ]);
    }

    public function test_unrecognized_qr_is_rejected(): void
    {
        $this->get('/api/r?c=NOT-A-CODE')->assertStatus(422);
        $this->assertDatabaseCount('receiving_scans', 0);
    }
}
