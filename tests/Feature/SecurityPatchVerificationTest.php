<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CdcChange;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SecurityPatchVerificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that conversion endpoints are now protected by authentication.
     */
    public function test_conversion_endpoints_deny_unauthenticated_access(): void
    {
        $response = $this->postJson('/convert', []);
        // Should redirect to login (302) or return 401
        $response->assertStatus(401); 

        $response = $this->postJson('/cdc/capture', []);
        $response->assertStatus(401);
    }

    /**
     * Test that sandbox validation detects bypass attempts with comments.
     */
    public function test_sandbox_detects_obfuscated_forbidden_keywords(): void
    {
        $user = User::factory()->create();
        
        $bypassSql = "/* Malicious Comment */ DROP /* another comment */ DATABASE sql_stream;";
        
        $response = $this->actingAs($user)->postJson('/convert/sandbox', [
            'sql' => $bypassSql
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('error', 'SQL contains forbidden keyword or pattern matching /\bDROP\s+DATABASE\b/i');
    }

    /**
     * Test that CDC capture prevents unauthorized table manipulation.
     */
    public function test_cdc_capture_prevents_unregistered_tables(): void
    {
        $user = User::factory()->create();
        
        // Try to capture a change for 'users' table which is NOT in migration_checkpoints
        $response = $this->actingAs($user)->postJson('/cdc/capture', [
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'table' => 'users',
            'data' => ['id' => 1, 'password' => 'pwned'],
            'operation' => 'UPDATE'
        ]);

        $response->assertStatus(500); // Exception thrown
        $this->assertDatabaseMissing('cdc_changes', ['table_name' => 'users']);
    }

    /**
     * Test that CDC capture ALLOWS registered tables.
     */
    public function test_cdc_capture_allows_registered_tables(): void
    {
        $user = User::factory()->create();
        
        // Register the table for migration
        DB::table('migration_checkpoints')->insert([
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'table_name' => 'posts',
            'checkpoint_column' => 'id',
        ]);

        $response = $this->actingAs($user)->postJson('/cdc/capture', [
            'source_db' => 'mysql_src',
            'target_db' => 'pgsql_tgt',
            'table' => 'posts',
            'data' => ['id' => 1, 'title' => 'Secure Post'],
            'operation' => 'INSERT'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('cdc_changes', ['table_name' => 'posts']);
    }

    /**
     * Test that PII masking still works on simple lines.
     */
    public function test_pii_masking_fast_path_works(): void
    {
         $sqlParser = new \App\Services\SQL\SQLParserService();
         $options = ['maskSensitiveData' => true];
         
         $line = "INSERT INTO users (email) VALUES ('secret@victim.com');";
         $masked = $sqlParser->maskSensitiveData($line, $options, ['users' => ['columns' => [['name' => 'email']]]]);
         
         $this->assertNotContains('secret@victim.com', [$masked]);
         $this->assertStringContainsString('INSERT INTO', $masked);
    }
}
