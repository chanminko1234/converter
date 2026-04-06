<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\GeminiService;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\DatabaseAdapters\SourceAdapterInterface;
use Mockery;
use Illuminate\Support\Facades\Http;

class IndexAdvisorControllerTest extends TestCase
{
    public function test_index_advisor_endpoint_provides_ai_recommendations()
    {
        // Mock Gemini Service
        $this->mock(GeminiService::class, function ($mock) {
            $mock->shouldReceive('suggestOptimizations')->andReturn([
                'suggestions' => [],
                'indexing_suggestions' => [
                    [
                        'type' => 'GIN',
                        'columns' => ['payload'],
                        'reason' => 'Better JSONB performance',
                        'sql' => 'CREATE INDEX idx_payload ON users USING GIN (payload);'
                    ]
                ]
            ]);
        });

        // Mock Source Adapter
        $mockAdapter = Mockery::mock(SourceAdapterInterface::class);
        $mockAdapter->shouldReceive('setupConnection')->once();
        $mockAdapter->shouldReceive('getTables')->andReturn(['events']);
        $mockAdapter->shouldReceive('getTableSchema')->andReturn('CREATE TABLE events (payload JSON)');
        
        $mockQuery = Mockery::mock(\Illuminate\Database\Query\Builder::class);
        $mockQuery->shouldReceive('limit')->andReturn($mockQuery);
        $mockQuery->shouldReceive('get')->andReturn(collect([['id' => 1]]));
        $mockAdapter->shouldReceive('getTableData')->andReturn($mockQuery);

        // Mock Factory
        $this->mock(SourceAdapterFactory::class, function ($mock) use ($mockAdapter) {
            $mock->shouldReceive('create')->andReturn($mockAdapter);
        });

        $response = $this->postJson('/convert/advise-indexes', [
            'source' => [
                'host' => 'localhost',
                'port' => '3306',
                'user' => 'root',
                'pass' => '',
                'db' => 'source_db'
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'recommendations',
                    'analyzed_tables',
                    'total_tables'
                ]
            ]);
            
        $this->assertCount(1, $response->json('data.recommendations'));
        $this->assertEquals('events', $response->json('data.recommendations.0.table'));
    }
}
