<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class GoldenFileTest extends TestCase
{
    use RefreshDatabase;

    private function getGoldenFile(string $filename): string
    {
        $path = base_path("tests/Fixtures/golden/{$filename}");

        return File::get($path);
    }

    private function extractExpectedOutput(string $goldenContent): string
    {
        // Remove comments and extract the SQL
        $lines = explode("\n", $goldenContent);
        $sqlLines = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (! empty($line) && ! str_starts_with($line, '--')) {
                $sqlLines[] = $line;
            }
        }

        return trim(implode("\n", $sqlLines));
    }

    private function extractInputFromComment(string $goldenContent): string
    {
        $lines = explode("\n", $goldenContent);
        foreach ($lines as $line) {
            if (str_contains($line, '-- Input:')) {
                return trim(str_replace('-- Input:', '', $line));
            }
        }

        return '';
    }

    public function test_basic_table_postgresql_conversion(): void
    {
        $goldenContent = $this->getGoldenFile('basic_table_postgresql.sql');
        $input = $this->extractInputFromComment($goldenContent);
        $expected = $this->extractExpectedOutput($goldenContent);

        $response = $this->post('/convert', [
            'mysql_dump' => $input,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        // Normalize whitespace for comparison
        $actualSql = preg_replace('/\s+/', ' ', trim($data['data']['sql']));
        $expectedSql = preg_replace('/\s+/', ' ', trim($expected));
        
        $this->assertEquals($expectedSql, $actualSql);
    }

    public function test_enum_table_postgresql_conversion(): void
    {
        $goldenContent = $this->getGoldenFile('enum_table_postgresql.sql');
        $input = $this->extractInputFromComment($goldenContent);
        $expected = $this->extractExpectedOutput($goldenContent);

        $response = $this->post('/convert', [
            'mysql_dump' => $input,
            'target_format' => 'postgresql',
            'options' => [
                'enumHandling' => 'check_constraint',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        // Normalize whitespace for comparison
        $actualSql = preg_replace('/\s+/', ' ', trim($data['data']['sql']));
        $expectedSql = preg_replace('/\s+/', ' ', trim($expected));
        
        $this->assertEquals($expectedSql, $actualSql);
    }

    public function test_set_table_postgresql_conversion(): void
    {
        $goldenContent = $this->getGoldenFile('set_table_postgresql.sql');
        $input = $this->extractInputFromComment($goldenContent);
        $expected = $this->extractExpectedOutput($goldenContent);

        $response = $this->post('/convert', [
            'mysql_dump' => $input,
            'target_format' => 'postgresql',
            'options' => [
                'setHandling' => 'array',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        // Normalize whitespace for comparison
        $actualSql = preg_replace('/\s+/', ' ', trim($data['data']['sql']));
        $expectedSql = preg_replace('/\s+/', ' ', trim($expected));
        
        $this->assertEquals($expectedSql, $actualSql);
    }

    public function test_basic_table_sqlite_conversion(): void
    {
        $goldenContent = $this->getGoldenFile('basic_table_sqlite.sql');
        $expectedSql = $this->extractExpectedOutput($goldenContent);
        $inputSql = $this->extractInputFromComment($goldenContent);

        $response = $this->post('/convert', [
            'mysql_dump' => $inputSql,
            'target_format' => 'sqlite',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        // Normalize whitespace for comparison
        $actualSql = preg_replace('/\s+/', ' ', trim($data['data']['sql']));
        $expectedSql = preg_replace('/\s+/', ' ', trim($expectedSql));
        
        $this->assertEquals($expectedSql, $actualSql, 'Basic SQLite conversion does not match golden file');
    }

    public function test_replace_statement_postgresql_conversion(): void
    {
        $goldenContent = $this->getGoldenFile('replace_statement_postgresql.sql');
        $expectedSql = $this->extractExpectedOutput($goldenContent);
        $inputSql = $this->extractInputFromComment($goldenContent);

        $response = $this->post('/convert', [
            'mysql_dump' => $inputSql,
            'target_format' => 'postgresql',
            'options' => [
                'replaceHandling' => 'upsert',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        // Normalize whitespace for comparison
        $actualSql = preg_replace('/\s+/', ' ', trim($data['data']['sql']));
        $expectedSql = preg_replace('/\s+/', ' ', trim($expectedSql));
        
        $this->assertEquals($expectedSql, $actualSql, 'REPLACE statement conversion does not match golden file');
    }

    public function test_regenerate_golden_files_when_needed(): void
    {
        // This test can be used to regenerate golden files when conversion logic changes
        // Uncomment and run when you need to update golden files

        /*
        $testCases = [
            [
                'input' => "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);",
                'target' => 'postgresql',
                'options' => ['preserveIdentity' => true, 'timezoneHandling' => 'utc'],
                'file' => 'basic_table_postgresql.sql'
            ],
            // Add more test cases as needed
        ];

        foreach ($testCases as $case) {
            $response = $this->post('/convert', [
                'mysql_sql' => $case['input'],
                'target_format' => $case['target'],
                'options' => $case['options']
            ]);

            $data = $response->json();
            $content = "-- Golden file: Generated output\n";
            $content .= "-- Input: {$case['input']}\n\n";
            $content .= $data['converted_sql'];

            File::put(base_path("tests/Fixtures/golden/{$case['file']}"), $content);
        }
        */

        $this->assertTrue(true, 'Golden file regeneration placeholder');
    }
}