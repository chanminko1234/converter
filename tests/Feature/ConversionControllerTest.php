<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConversionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_convert_endpoint_returns_successful_response(): void
    {
        $mysqlSql = 'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE);';

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'preserveIdentity' => true,
                'handleEnums' => 'check_constraint',
                'handleSets' => 'array',
                'timezoneHandling' => 'utc',
                'triggerHandling' => 'convert',
                'replaceHandling' => 'upsert',
                'ignoreHandling' => 'on_conflict_ignore',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'sql',
                    'format',
                    'report',
                ],
                'metadata' => [
                    'tables_processed',
                    'target_format',
                    'processing_time',
                ],
            ]);
    }

    public function test_convert_endpoint_handles_invalid_sql(): void
    {
        $response = $this->post('/convert', [
            'mysql_dump' => 'INVALID SQL SYNTAX',
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_convert_endpoint_supports_different_target_formats(): void
    {
        $mysqlSql = "INSERT INTO users (name, email) VALUES ('John', 'john@example.com');";

        $formats = ['postgresql', 'csv', 'xlsx', 'sqlite', 'psql'];

        foreach ($formats as $format) {
            $response = $this->post('/convert', [
                'mysql_dump' => $mysqlSql,
                'target_format' => $format,
                'options' => [],
            ]);

            $response->assertStatus(200);
        }
    }

    public function test_upload_endpoint_processes_sql_file(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->createWithContent(
            'test.sql',
            'CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));'
        );

        $response = $this->post('/convert/upload', [
            'file' => $file,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'sql',
                    'format',
                    'report',
                ],
                'metadata' => [
                    'tables_processed',
                    'target_format',
                    'processing_time',
                ],
            ]);
    }

    public function test_upload_endpoint_rejects_invalid_file_types(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('test.txt', 100);

        $response = $this->post('/convert/upload', [
            'file' => $file,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_convert_endpoint_handles_enum_conversion_options(): void
    {
        $mysqlSql = "CREATE TABLE status (id INT, status ENUM('active', 'inactive', 'pending'));";

        $enumOptions = ['varchar', 'check_constraint', 'enum_table'];

        foreach ($enumOptions as $option) {
            $response = $this->post('/convert', [
                'mysql_dump' => $mysqlSql,
                'target_format' => 'postgresql',
                'options' => [
                    'handleEnums' => $option,
                ],
            ]);

            $response->assertStatus(200);
            $data = $response->json();
            $this->assertNotEmpty($data['data']['sql']);
        }
    }

    public function test_convert_endpoint_handles_set_conversion_options(): void
    {
        $mysqlSql = "CREATE TABLE permissions (id INT, roles SET('admin', 'user', 'guest'));";

        $setOptions = ['varchar', 'array', 'separate_table'];

        foreach ($setOptions as $option) {
            $response = $this->post('/convert', [
                'mysql_dump' => $mysqlSql,
                'target_format' => 'postgresql',
                'options' => [
                    'handleSets' => $option,
                ],
            ]);

            $response->assertStatus(200);
            $data = $response->json();
            $this->assertNotEmpty($data['data']['sql']);
        }
    }

    public function test_convert_endpoint_handles_replace_statements(): void
    {
        $mysqlSql = "REPLACE INTO users (id, name) VALUES (1, 'John Doe');";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'replaceHandling' => 'upsert',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertStringContainsString('ON CONFLICT', $data['data']['sql']);
    }

    public function test_convert_endpoint_handles_insert_ignore_statements(): void
    {
        $mysqlSql = "INSERT IGNORE INTO users (name, email) VALUES ('Jane', 'jane@example.com');";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'ignoreHandling' => 'on_conflict_ignore',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertStringContainsString('ON CONFLICT DO NOTHING', $data['data']['sql']);
    }
}