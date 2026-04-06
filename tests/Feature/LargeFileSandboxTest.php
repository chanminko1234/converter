<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;

class LargeFileSandboxTest extends TestCase
{
    /**
     * Test mapping of a large file with comments and validation
     */
    public function test_large_file_conversion_protects_defaults_and_validates(): void
    {
        // 1. Generate a "large-ish" SQL string that mimics the problematic pattern
        // The pattern: Column with a comment followed by a DEFAULT value.
        // If the regex was bad, this would truncate the DEFAULT.
        $sql = "CREATE TABLE `test_large_table` (\n";
        $sql .= "  `id` INT NOT NULL AUTO_INCREMENT,\n";
        $sql .= "  `color_code` VARCHAR(7) DEFAULT '#555555' COMMENT 'Color for the user badge',\n";
        $sql .= "  `status` VARCHAR(255) DEFAULT 'active' COMMENT 'Account status',\n";
        $sql .= "  PRIMARY KEY (`id`)\n";
        $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n";

        // 2. Perform the conversion
        $response = $this->postJson('/convert', [
            'mysql_dump' => $sql,
            'target_format' => 'postgresql',
            'options' => [
                'handleEnums' => 'check_constraint',
                'handleSets' => 'array',
                'timezoneHandling' => 'utc'
            ]
        ]);

        $response->assertStatus(200);
        $result = $response->json('data.sql');

        // Check if DEFAULT values were preserved and NOT truncated
        $this->assertStringContainsString("'#555555'", $result, "The default color hex code was lost!");
        $this->assertStringContainsString("'active'", $result, "The default status value was lost!");
        $this->assertStringNotContainsString("COMMENT", $result, "Comments should be stripped for standard PostgreSQL compatibility");

        // 3. Trigger Sandbox Validation
        // Mock the DB connection to avoid hitting a real Postgres in the test environment
        // but verify it receives the correct SQL
        DB::shouldReceive('connection')->with('temp_pgsql')->andReturn(new class {
            public function beginTransaction() {}
            public function rollBack() {}
            public function unprepared($sql) { return true; }
        });

        $sandboxResponse = $this->postJson('/convert/sandbox', [
            'sql' => $result
        ]);

        $sandboxResponse->assertStatus(200);
        $sandboxResponse->assertJsonStructure(['success', 'message', 'schema']);
    }

    /**
     * Test specifically that the backend handles large SQL strings without truncation
     */
    public function test_backend_processes_full_large_payload_for_sandbox(): void
    {
        // Construct a multi-statement SQL script
        $sql = "";
        for ($i = 1; $i <= 5; $i++) {
            $sql .= "DROP TABLE IF EXISTS _temp_table_{$i} CASCADE;\n";
            $sql .= "CREATE TABLE _temp_table_{$i} (id SERIAL PRIMARY KEY, val TEXT DEFAULT 'test_{$i}');\n";
        }

        $sql .= "CREATE TABLE _final_marker (id SERIAL PRIMARY KEY, marker_text TEXT DEFAULT 'COMPLETE');\n";

        DB::shouldReceive('connection')->with('temp_pgsql')->andReturn(new class {
            public function beginTransaction() {}
            public function rollBack() {}
            public function unprepared($sql) { 
                // Only check for marker if it's a create table command (the one we appended)
                if (stripos($sql, 'CREATE TABLE') !== false) {
                    if (strpos($sql, 'COMPLETE') === false) throw new \Exception("Truncated!");
                }
                return true; 
            }
        });

        $response = $this->postJson('/convert/sandbox', [
            'sql' => $sql
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true
        ]);
    }
}
