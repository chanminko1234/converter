<?php

namespace Tests\Unit;

use App\Services\BinlogListener;
use App\Models\CdcChange;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BinlogListenerTest extends TestCase
{
    use RefreshDatabase;

    private BinlogListener $listener;

    protected function setUp(): void
    {
        parent::setUp();
        $this->listener = new BinlogListener();
    }

    public function test_capture_change_creates_record(): void
    {
        $change = $this->listener->captureChange(
            'source_db',
            'target_db',
            'users',
            ['id' => 1, 'email' => 'test@example.com'],
            'INSERT'
        );

        $this->assertInstanceOf(CdcChange::class, $change);
        $this->assertEquals('INSERT', $change->operation_type);
        $this->assertEquals('users', $change->table_name);
        
        $this->assertDatabaseHas('cdc_changes', [
            'table_name' => 'users',
            'operation_type' => 'INSERT'
        ]);
    }

    public function test_replay_pending_changes_updates_status(): void
    {
        // Instead of mocking DB facade, let's use a real connection for testing if possible
        // Or better: Mock the internal method or use a safer mocking approach.
        // For unit tests, we can mock the model behavior or just accept that it uses DB::connection('temp_pgsql')
        
        // Define a temporary connection in config for testing
        config(['database.connections.temp_pgsql' => config('database.connections.sqlite')]);

        // Create a table in the temp_pgsql (which is actually sqlite in memory for this test)
        DB::connection('temp_pgsql')->getSchemaBuilder()->create('users', function($table) {
            $table->id();
            $table->string('name');
        });

        // Create a pending change
        CdcChange::create([
            'operation_type' => 'INSERT',
            'table_name' => 'users',
            'payload' => ['id' => 1, 'name' => 'Data'],
            'source_db' => 's1',
            'target_db' => 't1',
            'replayed' => false
        ]);

        $result = $this->listener->replayPendingChanges('s1', 't1');

        $this->assertEquals(1, $result['replayed_count']);
        $this->assertEmpty($result['errors']);
        
        $this->assertDatabaseHas('cdc_changes', [
            'table_name' => 'users',
            'replayed' => true
        ]);

        // Verify the data was actually "replayed" to the temp_pgsql connection
        $this->assertEquals(1, DB::connection('temp_pgsql')->table('users')->count());
    }

    public function test_replay_handles_errors_gracefully(): void
    {
        // Force an error by targeting a non-existent table
        CdcChange::create([
            'operation_type' => 'INSERT',
            'table_name' => 'non_existent_table',
            'payload' => ['id' => 1],
            'source_db' => 's1',
            'target_db' => 't1',
            'replayed' => false
        ]);

        $result = $this->listener->replayPendingChanges('s1', 't1');

        $this->assertEquals(0, $result['replayed_count']);
        $this->assertCount(1, $result['errors']);
    }
}
