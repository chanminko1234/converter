<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrchestrationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_get_status_returns_accurate_metrics()
    {
        // Seed migration checkpoints
        DB::table('migration_checkpoints')->insert([
            [
                'source_db' => 'source_db',
                'target_db' => 'target_db',
                'table_name' => 'users',
                'checkpoint_column' => 'id',
                'last_value' => '100',
                'rows_synced' => 100,
                'last_throughput' => 50,
                'sync_status' => 'completed',
                'last_synced_at' => now(),
            ],
            [
                'source_db' => 'source_db',
                'target_db' => 'target_db',
                'table_name' => 'posts',
                'checkpoint_column' => 'id',
                'last_value' => '50',
                'rows_synced' => 50,
                'last_throughput' => 10,
                'sync_status' => 'syncing',
                'last_synced_at' => now(),
            ]
        ]);

        $response = $this->actingAs($this->user)->postJson('/convert/migration-status', [
            'source_db' => 'source_db',
            'target_db' => 'target_db'
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.metrics.total_rows_migrated', 150)
            ->assertJsonPath('data.metrics.active_streams', 1)
            ->assertJsonPath('data.metrics.completed_tables', 1)
            ->assertJsonPath('data.metrics.total_tables', 2);
    }

    public function test_cutover_fails_with_pending_cdc_changes()
    {
        // Seed pending CDC change
        DB::table('cdc_changes')->insert([
            'source_db' => 'source_db',
            'target_db' => 'target_db',
            'table_name' => 'users',
            'operation_type' => 'INSERT',
            'payload' => json_encode(['id' => 101]),
            'replayed' => false,
            'captured_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->postJson('/convert/cutover', [
            'source_db' => 'source_db',
            'target_db' => 'target_db'
        ]);

        $response->assertStatus(409)
            ->assertJsonFragment(['success' => false])
            ->assertJsonPath('pending_count', 1);
    }

    public function test_cutover_succeeds_when_parity_achieved()
    {
        // Ensure no pending CDC
        DB::table('cdc_changes')->delete();

        // Seed some checkpoints to be finalized
        DB::table('migration_checkpoints')->insert([
            'source_db' => 'source_db',
            'target_db' => 'target_db',
            'table_name' => 'users',
            'sync_status' => 'completed',
            'last_value' => '100',
            'checkpoint_column' => 'id'
        ]);

        $response = $this->actingAs($this->user)->postJson('/convert/cutover', [
            'source_db' => 'source_db',
            'target_db' => 'target_db'
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('cutover', DB::table('migration_checkpoints')->first()->sync_status);
    }
}
