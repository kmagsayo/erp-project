<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryReceiptTokenTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.connections.sqlite.database') !== ':memory:') {
            $this->fail('Refusing to run against the local database file.');
        }
    }

    public function test_guest_cannot_confirm_a_delivery_receipt(): void
    {
        $this->postJson('/api/delivery-receipt-tokens/confirm', [
            'token' => $this->token(),
        ])->assertUnauthorized();
    }

    public function test_invalid_qr_is_rejected(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens/confirm', [
                'token' => 'RCVITEM:RCV-00001:abc',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'This QR code is not a delivery receipt.');
    }

    public function test_unknown_token_cannot_be_confirmed(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens/confirm', [
                'token' => $this->token(),
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('delivery_receipt_tokens', 0);
    }

    public function test_authorized_user_confirms_once(): void
    {
        $user = $this->activeUser();
        $token = $this->token();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens', [
                'token' => 'DRCV:'.$token,
                'receiptId' => 'DR-000001',
            ])
            ->assertOk()
            ->assertJsonPath('data.receiptId', 'DR-000001')
            ->assertJsonPath('data.confirmed', false);

        $first = $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens/confirm', [
                'token' => $token,
                'remarks' => 'Received in good condition.',
            ]);

        $first->assertOk()
            ->assertJsonPath('data.receiptId', 'DR-000001')
            ->assertJsonPath('data.receivedBy', 'WEB ADMINISTRATOR')
            ->assertJsonPath('data.remarks', 'Received in good condition.')
            ->assertJsonPath('data.confirmed', true);

        $this->assertDatabaseCount('delivery_receipt_tokens', 1);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens/confirm', [
                'token' => strtoupper($token),
            ])
            ->assertStatus(409)
            ->assertJsonPath('message', 'This delivery was already confirmed.');

        $this->assertDatabaseCount('delivery_receipt_tokens', 1);
    }

    public function test_token_cannot_be_reassigned(): void
    {
        $user = $this->activeUser();
        $token = $this->token();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens', [
                'token' => $token,
                'receiptId' => 'DR-000001',
            ])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens', [
                'token' => $token,
                'receiptId' => 'DR-000002',
            ])
            ->assertStatus(409);

        $this->assertDatabaseCount('delivery_receipt_tokens', 1);
    }

    public function test_inactive_user_cannot_confirm(): void
    {
        $user = User::factory()->create([
            'name' => 'Inactive User',
            'username' => 'inactive-receiver',
            'email' => 'inactive@responsivcode.com',
            'password' => 'secret-pass',
            'type' => 'staff',
            'status' => 'inactive',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery-receipt-tokens', [
                'token' => $this->token(),
                'receiptId' => 'DR-000003',
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('delivery_receipt_tokens', 0);
    }

    private function activeUser(): User
    {
        return User::factory()->create([
            'name' => 'WEB ADMINISTRATOR',
            'username' => 'receiver',
            'email' => 'receiver@responsivcode.com',
            'password' => 'secret-pass',
            'type' => 'admin',
            'status' => 'active',
        ]);
    }

    private function token(): string
    {
        return '0123456789abcdef0123456789abcdef';
    }
}
