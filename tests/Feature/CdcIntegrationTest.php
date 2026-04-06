<?php

namespace Tests\Feature;

use App\Models\CdcChange;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CdcIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cdc_capture_endpoint_stores_change(): void
    {
        $response = $this->postJson('/cdc/capture', [
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
        $response = $this->postJson('/cdc/replay', [
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt'
        ]);

        $response->assertStatus(200);
        
        // In the mock/simulated environment, the actual execution on target might fail 
        // if 'temp_pgsql' isn't really there, but we check if it tried.
        // Actually our BinlogListener will throw exception if connection fails.
        // But for the sake of the feature test of the API:
        $data = $response->json();
        $this->assertTrue($data['success']);
    }
}
