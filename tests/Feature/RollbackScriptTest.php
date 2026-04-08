<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RollbackScriptTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the rollback script correctly generates drop statements in reverse order.
     */
    public function test_generates_comprehensive_rollback_script(): void
    {
        $mysqlSql = "CREATE TABLE authors (id INT PRIMARY KEY);\n" .
                    "CREATE TABLE books (id INT PRIMARY KEY, author_id INT, FOREIGN KEY (author_id) REFERENCES authors(id));";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
        ]);

        $response->assertStatus(200);
        $rollback = $response->json('rollback');

        $this->assertNotNull($rollback);
        $this->assertStringContainsString('ENTERPRISE ROLLBACK SCRIPT', $rollback);
        
        // 1. Check that tables are dropped with CASCADE to handle foreign keys
        $this->assertStringContainsString('DROP TABLE IF EXISTS books CASCADE;', str_replace('"', '', $rollback));
        $this->assertStringContainsString('DROP TABLE IF EXISTS authors CASCADE;', str_replace('"', '', $rollback));
        
        // 2. Check the reverse order (books, then authors)
        $booksPos = strpos($rollback, 'books');
        $authorsPos = strpos($rollback, 'authors');
        $this->assertTrue($booksPos < $authorsPos, "Rolling back must drop child tables before parent tables to prevent dependency errors.");
        
        // 3. Check for the compatibility function drop
        $this->assertStringContainsString('DROP FUNCTION IF EXISTS substring_index', $rollback);
        
        // 4. Ensure it's wrapped in a transaction for atomicity
        $this->assertStringContainsString('BEGIN;', $rollback);
        $this->assertStringContainsString('COMMIT;', $rollback);
    }

    /**
     * Test rollback for a complex multi-table enterprise schema.
     */
    public function test_generates_complex_enterprise_rollback(): void
    {
        $mysqlSql = "CREATE TABLE users (id INT PRIMARY KEY);\n" .
                    "CREATE TABLE profiles (id INT PRIMARY KEY, user_id INT, FOREIGN KEY (user_id) REFERENCES users(id));\n" .
                    "CREATE TABLE audit_logs (id INT PRIMARY KEY, profile_id INT, FOREIGN KEY (profile_id) REFERENCES profiles(id));";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
        ]);

        $response->assertStatus(200);
        $rollback = $response->json('rollback');

        // Check for correct drop order: child-most first (audit_logs -> profiles -> users)
        $auditPos = strpos($rollback, 'audit_logs');
        $profilePos = strpos($rollback, 'profiles');
        $userPos = strpos($rollback, 'users');
        
        $this->assertTrue($auditPos < $profilePos, "audit_logs must be dropped before profiles");
        $this->assertTrue($profilePos < $userPos, "profiles must be dropped before users");
        
        // Ensure cascading is explicitly mentioned for each drop line
        $this->assertEquals(3, substr_count($rollback, 'CASCADE;'));
        
        // Verify transaction semantics
        $this->assertStringStartsWith('-- ==========================================================', $rollback);
        $this->assertStringContainsString('BEGIN;', $rollback);
        $this->assertStringContainsString('COMMIT;', $rollback);
    }
}
