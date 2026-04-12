<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\DatabaseAdapters\SourceAdapterInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Mockery;

class ValidationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }
    public function test_validate_data_endpoint_processes_integrity_check()
    {
        // Mock Source Adapter
        $mockAdapter = Mockery::mock(SourceAdapterInterface::class);
        $mockAdapter->shouldReceive('setupConnection')->once();
        $mockAdapter->shouldReceive('getTables')->andReturn(['users', 'posts']);
        
        // Mock Row Counts & Data
        $mockQuery = Mockery::mock(\Illuminate\Database\Query\Builder::class);
        $mockQuery->shouldReceive('count')->andReturn(100);
        $mockQuery->shouldReceive('limit')->andReturn($mockQuery);
        $mockQuery->shouldReceive('get')->andReturn(collect([['id' => 1, 'name' => 'Test']]));
        
        $mockAdapter->shouldReceive('getTableData')->with('users')->andReturn($mockQuery);
        $mockAdapter->shouldReceive('getTableData')->with('posts')->andReturn($mockQuery);

        // Mock Factory
        $this->mock(SourceAdapterFactory::class, function ($mock) use ($mockAdapter) {
            $mock->shouldReceive('create')->andReturn($mockAdapter);
        });

        // Mock Target DB
        DB::shouldReceive('connection')->with('temp_target_pgsql')->andReturnSelf();
        DB::shouldReceive('query')->andReturn($mockQuery);
        DB::shouldReceive('select')->andReturn([new \stdClass()]);
        DB::shouldReceive('table')->andReturn($mockQuery);
        DB::shouldReceive('purge')->with('temp_target_pgsql')->once();

        $response = $this->actingAs($this->user)->postJson('/convert/validate', [
            'source' => [
                'host' => 'localhost',
                'port' => '3306',
                'user' => 'root',
                'pass' => '',
                'db' => 'source_db'
            ],
            'target' => [
                'host' => 'localhost',
                'port' => '5432',
                'user' => 'postgres',
                'pass' => '',
                'db' => 'target_db'
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'results',
                    'summary' => ['total_tables', 'passed', 'failed'],
                    'validated_at'
                ]
            ]);
    }
}
