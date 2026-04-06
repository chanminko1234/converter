<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EnterpriseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that all global navigation pages render successfully.
     */
    public function test_global_pages_render(): void
    {
        $pages = ['/', '/docs', '/status', '/support', '/overview'];

        foreach ($pages as $page) {
            $response = $this->get($page);
            $response->assertStatus(200);
        }
    }

    /**
     * Test a complete enterprise migration flow with mixed options.
     */
    public function test_full_enterprise_conversion_flow(): void
    {
        $mysqlDump = "CREATE TABLE employees (social_security VARCHAR(20), salary DECIMAL(10,2));\n" .
                     "INSERT INTO employees VALUES ('123-456-789', 50000.00);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlDump,
            'target_format' => 'postgresql',
            'options' => [
                'dataMasking' => true,
                'autoCleaning' => true,
                'frameworkPreset' => 'laravel'
            ]
        ]);

        $response->assertStatus(200);
        
        // 1. Verify schema conversion
        $this->assertStringContainsString('CREATE TABLE', $response->json('data.sql'));
        $this->assertStringContainsString('employees', $response->json('data.sql'));
        
        // 2. Verify PII masking (SSN should be gone)
        $this->assertStringNotContainsString('123-456-789', $response->json('data.sql'));
        
        // 3. Verify rollback script generation
        $this->assertStringContainsString('ENTERPRISE ROLLBACK SCRIPT', $response->json('rollback'));
        $this->assertStringContainsString('DROP TABLE IF EXISTS', $response->json('rollback'));
        $this->assertStringContainsString('employees', $response->json('rollback'));
    }

    /**
     * Test complex query translation with common MySQL function mixtures.
     */
    public function test_transpiles_mixed_complex_queries(): void
    {
        $query = "SELECT u.id, IFNULL(CONCAT(u.first_name, ' ', u.last_name), 'Unknown'), " .
                 "DATEDIFF(NOW(), u.created_at) as age_days " .
                 "FROM `users` u WHERE u.email LIKE '%@gmail.com' " .
                 "ORDER BY u.id DESC LIMIT 10;";

        $response = $this->post('/translate-query', [
            'query' => $query
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        // IFNULL -> COALESCE
        $this->assertStringContainsString('COALESCE(', $translated);
        
        // DATEDIFF -> ((...)::date - (...)::date)
        $this->assertStringContainsString('::date - ', $translated);
        
        // LIMIT 10 -> LIMIT 10 (valid in both, offset might be added depending on engine version)
        $this->assertStringContainsString('LIMIT 10', $translated);
        
        // Double quotes on identifiers
        $this->assertStringContainsString('"users"', $translated);
    }

    /**
     * Test real-time status reporting for multiple tables.
     */
    public function test_enterprise_status_metrics(): void
    {
        // 1. Seed checkpoints
        \Illuminate\Support\Facades\DB::table('migration_checkpoints')->insert([
            ['source_db' => 'mysql_prod', 'target_db' => 'pg_prod', 'table_name' => 'orders', 'rows_synced' => 100000, 'last_throughput' => 5500.5, 'sync_status' => 'syncing', 'last_synced_at' => now()],
            ['source_db' => 'mysql_prod', 'target_db' => 'pg_prod', 'table_name' => 'items', 'rows_synced' => 500000, 'last_throughput' => 12000.2, 'sync_status' => 'completed', 'last_synced_at' => now()],
        ]);

        $response = $this->postJson('/convert/status', [
            'source_db' => 'mysql_prod',
            'target_db' => 'pg_prod',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(2, 'stats');

        $stats = collect($response->json('stats'));
        
        $orders = $stats->where('table_name', 'orders')->first();
        $this->assertEquals(100000, $orders['rows_synced']);
        $this->assertEquals(5500.5, $orders['last_throughput']);
        $this->assertEquals('syncing', $orders['sync_status']);

        $items = $stats->where('table_name', 'items')->first();
        $this->assertEquals('completed', $items['sync_status']);
    }

    /**
     * Test analysis output for mapper structure.
     */
    public function test_schema_analysis_output_for_mapper(): void
    {
        $mysqlDump = "CREATE TABLE products (\n" .
                     "  id INT PRIMARY KEY,\n" .
                     "  price DECIMAL(10,2),\n" .
                     "  sensitive_key VARCHAR(100)\n" .
                     ");";

        $response = $this->postJson('/convert/analyze', [
            'mysql_dump' => $mysqlDump,
            'options' => ['dataMasking' => true]
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'schema_meta' => [
                        '*' => [
                            'name',
                            'columns',
                            'foreign_keys'
                        ]
                    ]
                ]
            ]);

        $schemaMeta = collect($response->json('data.schema_meta'));
        $productsTable = $schemaMeta->where('name', 'products')->first();
        
        $this->assertNotNull($productsTable, 'Products table not found in schema_meta');
        $columns = $productsTable['columns'];
        
        // Find sensitive column
        $sensitive = collect($columns)->where('name', 'sensitive_key')->first();
        $this->assertEquals('PASSWORD', $sensitive['pii_tag']);
        $this->assertEquals('VARCHAR(100)', $sensitive['original_type']);
    }
}
