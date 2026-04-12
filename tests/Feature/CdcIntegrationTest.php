<?php

namespace Tests\Feature;

use App\Models\CdcChange;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CdcIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = \App\Models\User::factory()->create();
    }

    public function test_cdc_capture_endpoint_stores_change(): void
    {
        // Register table for security validation
        DB::table('migration_checkpoints')->insert([
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'table_name' => 'users',
            'checkpoint_column' => 'id',
        ]);

        $response = $this->actingAs($this->user)->postJson('/cdc/capture', [
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'table' => 'users',
            'data' => ['id' => 1, 'name' => 'John Doe'],
            'operation' => 'INSERT'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cdc_changes', [
            'table_name' => 'users',
            'operation_type' => 'INSERT'
        ]);
    }

    public function test_cdc_replay_endpoint_processes_pending_changes(): void
    {
        // Register table for security validation
        DB::table('migration_checkpoints')->insert([
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'table_name' => 'posts',
            'checkpoint_column' => 'id',
        ]);

        // Mock a pending change
        CdcChange::create([
            'operation_type' => 'INSERT',
            'table_name' => 'posts',
            'payload' => ['id' => 10, 'title' => 'New Post'],
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'replayed' => false
        ]);

        // We use the replay endpoint
        $response = $this->actingAs($this->user)->postJson('/cdc/replay', [
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt'
        ]);

        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertTrue($data['success']);
    }
}
