<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\AI\GeminiService;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\DatabaseAdapters\SourceAdapterInterface;
use Mockery;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

class NeuralEngineEnterpriseTest extends TestCase
{
    /**
     * Test the Index Advisor with multiple source types
     */
    public function test_index_advisor_handles_enterprise_sources()
    {
        // Mock Gemini
        $this->mock(GeminiService::class, function ($mock) {
            $mock->shouldReceive('suggestOptimizations')->andReturn([
                'indexing_suggestions' => [
                    [
                        'type' => 'BRIN',
                        'columns' => ['created_at'],
                        'reason' => 'Large time series data',
                        'sql' => 'CREATE INDEX idx_brin ON orders USING BRIN (created_at);'
                    ]
                ]
            ]);
        });

        // Mock Adapter
        $mockAdapter = Mockery::mock(SourceAdapterInterface::class);
        $mockAdapter->shouldReceive('setupConnection')->once();
        $mockAdapter->shouldReceive('getTables')->andReturn(['orders']);
        $mockAdapter->shouldReceive('getTableSchema')->andReturn('CREATE TABLE orders (id INT, created_at TIMESTAMP)');
        $mockQuery = Mockery::mock(\Illuminate\Database\Query\Builder::class);
        $mockQuery->shouldReceive('limit')->andReturn($mockQuery);
        $mockQuery->shouldReceive('get')->andReturn(collect([['id' => 1]]));
        $mockAdapter->shouldReceive('getTableData')->andReturn($mockQuery);

        $this->mock(SourceAdapterFactory::class, function ($mock) use ($mockAdapter) {
            // Test for Oracle specific source type
            $mock->shouldReceive('create')->with('oracle')->andReturn($mockAdapter);
        });

        $response = $this->postJson('/convert/advise-indexes', [
            'source' => [
                'host' => 'oracle.local',
                'port' => '1521',
                'user' => 'system',
                'pass' => 'topsecret',
                'db' => 'XE'
            ],
            'source_type' => 'oracle'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('orders', $response->json('data.recommendations.0.table'));
    }

    /**
     * Test the AI reasoning engine directly
     */
    public function test_gemini_service_generates_accurate_logic()
    {
        // Fake the Gemini API response
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '```json
{
    "indexing_suggestions": [
        {
            "type": "PARTIAL",
            "columns": ["deleted_at"],
            "reason": "Optimize soft deletes",
            "sql": "CREATE INDEX idx_soft_del ON users (id) WHERE deleted_at IS NULL;"
        }
    ]
}
```'
                                ]
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        Config::set('services.gemini.key', 'fake-key');

        $service = app(GeminiService::class);
        $suggestions = $service->suggestOptimizations('users', [['name' => 'id', 'type' => 'int'], ['name' => 'deleted_at', 'type' => 'timestamp']]);

        $this->assertCount(1, $suggestions['indexing_suggestions']);
        $this->assertEquals('PARTIAL', $suggestions['indexing_suggestions'][0]['type']);
    }

    /**
     * Test validation failure paths
     */
    public function test_index_advisor_validates_inputs()
    {
        $response = $this->postJson('/convert/advise-indexes', [
            'source' => [
                'host' => 'incomplete'
                // missing db, user, pass
            ]
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['source.user', 'source.db']);
    }
}
