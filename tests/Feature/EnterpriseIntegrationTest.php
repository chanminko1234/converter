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
}
