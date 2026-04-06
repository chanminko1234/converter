<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiConversionTest extends TestCase
{
    /**
     * Test that enablement of predictive refactoring calls the AI service
     */
    public function test_predictive_refactoring_calls_gemini_service()
    {
        config(['services.gemini.key' => 'test-key']);

        // Mock Gemini API responses
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push([
                    'candidates' => [
                        [
                            'content' => [
                                'parts' => [
                                    ['text' => json_encode([
                                        'suggestions' => [
                                            [
                                                'column' => 'payload',
                                                'reason' => 'Suggest using JSONB for better performance and indexing.',
                                                'sql' => 'ALTER TABLE test_table ALTER COLUMN payload TYPE JSONB USING payload::jsonb;'
                                            ]
                                        ]
                                    ])]
                                ]
                            ]
                        ]
                    ]
                ], 200)
                ->push([
                    'candidates' => [
                        [
                            'content' => [
                                'parts' => [
                                    ['text' => json_encode([
                                        'sql' => "CREATE OR REPLACE FUNCTION audit_trigger()\nRETURNS TRIGGER AS \$\$\nBEGIN\n  INSERT INTO audit_log(user_id, action) VALUES(NEW.id, 'INSERT');\n  RETURN NEW;\nEND;\n\$\$ LANGUAGE plpgsql;",
                                        'explanation' => 'Converted MySQL trigger to PostgreSQL PL/pgSQL function and trigger block.'
                                    ])]
                                ]
                            ]
                        ]
                    ]
                ], 200)
        ]);

        $mysqlDump = "
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50),
                payload TEXT
            );
            
            CREATE TRIGGER after_user_insert AFTER INSERT ON users FOR EACH ROW
            INSERT INTO audit_log(user_id, action) VALUES(NEW.id, 'INSERT');
        ";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlDump,
            'target_format' => 'postgresql',
            'options' => [
                'predictive_refactoring' => true,
                'trigger_handling' => 'convert'
            ]
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        // Verify AI Suggestions are in the report
        $this->assertStringContainsString('Suggest using JSONB', json_encode($data['report']));
        
        // Verify AI Transpiled logic is in the SQL
        $this->assertStringContainsString('CREATE OR REPLACE FUNCTION audit_trigger()', $data['sql']);
        $this->assertStringContainsString('AI Transpiled Object', json_encode($data['report']));
    }
}
