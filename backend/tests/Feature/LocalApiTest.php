<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.connections.sqlite.database') !== ':memory:') {
            $this->fail('Refusing to run against the local database file.');
        }
    }

    public function test_health_reports_the_local_database(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('database', 'ok');
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/login', [
            'email' => 'admin',
            'password' => 'not-the-password',
        ])->assertStatus(422);
    }

    public function test_login_and_logout_use_a_bearer_token(): void
    {
        User::factory()->create([
            'name' => 'WEB ADMINISTRATOR',
            'username' => 'admin',
            'email' => 'admin@responsivcode.com',
            'password' => 'secret-pass',
            'type' => 'admin',
            'status' => 'active',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'admin',
            'password' => 'secret-pass',
        ]);

        $login->assertOk();
        $token = $login->json('token');
        $this->assertNotEmpty($token);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'admin@responsivcode.com');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_login_route_does_not_return_a_server_error(): void
    {
        $response = $this->get('/login');

        $this->assertContains($response->getStatusCode(), [200, 503]);
    }
}
