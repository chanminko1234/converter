<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TuningValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }
    /**
     * Test that an empty slow_query_log (converted to null) passes validation.
     */
    public function test_empty_slow_query_log_passes_validation(): void
    {
        $response = $this->actingAs($this->user)->postJson('/convert/tune', [
            'ram_gb' => 16,
            'cpu_cores' => 4,
            'storage_type' => 'ssd',
            'connection_count' => 100,
            'data_volume_gb' => 10,
            'slow_query_log' => "" // Should be converted to null and pass due to 'nullable'
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
    }

    /**
     * Test that missing slow_query_log passes validation.
     */
    public function test_missing_slow_query_log_passes_validation(): void
    {
        $response = $this->actingAs($this->user)->postJson('/convert/tune', [
            'ram_gb' => 16,
            'cpu_cores' => 4,
            'storage_type' => 'ssd',
            'connection_count' => 100,
            'data_volume_gb' => 10
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
    }
}
