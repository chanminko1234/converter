<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Jobs\SyncDatabaseJob;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\DatabaseAdapters\SourceAdapterInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class SyncDatabaseJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_job_streams_data_accurately()
    {
        // Mock Source Adapter
        $mockAdapter = Mockery::mock(SourceAdapterInterface::class);
        $mockAdapter->shouldReceive('setupConnection')->once();
        $mockAdapter->shouldReceive('getTables')->andReturn(['users']);
        
        $mockQuery = Mockery::mock(\Illuminate\Database\Query\Builder::class);
        $mockQuery->shouldReceive('chunk')->andReturnUsing(function($size, $callback) {
            $callback(collect([(object)['id' => 1, 'name' => 'John', 'email' => 'john@example.com', 'password' => 'secret']]));
        });
        
        $mockAdapter->shouldReceive('getTableData')->with('users')->andReturn($mockQuery);

        // Mock Factory
        $this->mock(SourceAdapterFactory::class, function ($mock) use ($mockAdapter) {
            $mock->shouldReceive('create')->with('mysql')->andReturn($mockAdapter);
        });

        // Configure target
        $source = ['db' => 'source_db', 'host' => 'localhost', 'port' => '3306', 'user' => 'root', 'pass' => ''];
        $target = ['db' => 'target_db', 'connection' => 'sqlite'];

        \Illuminate\Support\Facades\Log::shouldReceive('error')->never();

        $job = new SyncDatabaseJob($source, $target, [], 'mysql');
        $job->handle();

        // Assert row was actually inserted into target
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);

        // Assert checkpoint was updated
        $this->assertDatabaseHas('migration_checkpoints', [
            'source_db' => 'source_db',
            'table_name' => 'users',
            'sync_status' => 'completed',
            'rows_synced' => 1
        ]);
    }

    public function test_sync_job_handles_failure_gracefully()
    {
        $mockAdapter = Mockery::mock(SourceAdapterInterface::class);
        $mockAdapter->shouldReceive('setupConnection')->andThrow(new \Exception("Connection Failed"));

        $this->mock(SourceAdapterFactory::class, function ($mock) use ($mockAdapter) {
            $mock->shouldReceive('create')->andReturn($mockAdapter);
        });

        $source = ['db' => 'err_db', 'host' => 'localhost', 'port' => '3306', 'user' => 'root', 'pass' => ''];
        $target = ['db' => 'err_target_db', 'host' => 'localhost', 'port' => '5432', 'user' => 'postgres', 'pass' => ''];

        $job = new SyncDatabaseJob($source, $target, [], 'mysql');
        
        // Ensure it doesn't crash the whole process, but logs error (or in this case, doesn't throw)
        $job->handle();
        
        // Status should still be empty or captured in logs (simplified check)
        $this->assertDatabaseCount('migration_checkpoints', 0);
    }
}
