<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StagingDatabaseGeneratorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the PII Defense Engine correctly uses Faker for realistic data replacement.
     */
    public function test_pii_defense_engine_uses_faker_for_realistic_data(): void
    {
        $mysqlSql = "CREATE TABLE users (id INT, first_name VARCHAR(50), last_name VARCHAR(50), email VARCHAR(100), phone VARCHAR(20), address TEXT);\n" .
                    "INSERT INTO users (id, first_name, last_name, email, phone, address) VALUES " .
                    "(1, 'John', 'Doe', 'john.doe@example.com', '+1-555-0101', '123 Real St, Springfield');";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'dataMasking' => true,
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // Verify that original sensitive data is GONE
        $this->assertStringNotContainsString("'John'", $sql);
        $this->assertStringNotContainsString("'Doe'", $sql);
        $this->assertStringNotContainsString('john.doe@example.com', $sql);
        $this->assertStringNotContainsString('+1-555-0101', $sql);
        $this->assertStringNotContainsString('123 Real St', $sql);

        // Verify that we have some data in the VALUES clause (should be fake but present)
        $this->assertStringContainsString('INSERT INTO users', str_replace('"', '', $sql));
        $this->assertStringContainsString('VALUES', $sql);
        
        // Verify we still have a valid email format in the output
        $this->assertMatchesRegularExpression('/\'[^\'@\s]+@[^\'@\s]+\.[^\'@\s]+\'/', $sql);
    }

    /**
     * Test that multi-row INSERT statements are correctly masked.
     */
    public function test_multi_row_insert_masking(): void
    {
        $mysqlSql = "INSERT INTO users (first_name, email) VALUES ('Alice', 'alice@test.com'), ('Bob', 'bob@test.com');";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'dataMasking' => true,
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        $this->assertStringNotContainsString("'Alice'", $sql);
        $this->assertStringNotContainsString("'Bob'", $sql);
        $this->assertStringNotContainsString('alice@test.com', $sql);
        $this->assertStringNotContainsString('bob@test.com', $sql);

        // Check that we still have two rows in the INSERT (more robustly)
        $valuesPart = substr($sql, strpos(strtoupper($sql), 'VALUES'));
        $this->assertEquals(2, substr_count($valuesPart, '('));
    }

    /**
     * Test that columns with non-PII data are preserved while PII columns are masked.
     */
    public function test_preserves_non_pii_columns(): void
    {
        $mysqlSql = "INSERT INTO users (id, status, email) VALUES (999, 'active', 'secret@hidden.com');";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'dataMasking' => true,
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // 'id' and 'status' should be preserved (999 and 'active')
        $this->assertStringContainsString('999', $sql);
        $this->assertStringContainsString("'active'", $sql);
        
        // 'email' should be masked
        $this->assertStringNotContainsString('secret@hidden.com', $sql);
    }

    /**
     * Test masking when column list is NOT provided (fallback to global regex).
     */
    public function test_fallback_masking_without_column_list(): void
    {
        // Many MySQL dumps omit the column list if all columns are provided
        $mysqlSql = "INSERT INTO users VALUES (1, 'John', 'Doe', 'fallback@test.com', '555-9999');";

        $response = $this->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'dataMasking' => true,
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // Email and phone should still be masked by fallback regex
        $this->assertStringNotContainsString('fallback@test.com', $sql);
        $this->assertStringNotContainsString('555-9999', $sql);
        
        // Names ('John', 'Doe') might NOT be masked here because there's no column context
        // This confirms the fallback behavior works for identifiable patterns.
    }
}
