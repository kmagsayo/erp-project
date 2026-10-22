<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        if (is_file(public_path('ui/index.html'))) {
            $response->assertOk();

            return;
        }

        $response->assertStatus(503);
        $response->assertSee('start-local.bat');
    }
}
