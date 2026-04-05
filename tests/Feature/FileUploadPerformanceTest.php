<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileUploadPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_endpoint_enforces_100mb_limit(): void
    {
        Storage::fake('local');

        // Create a file slightly over 100MB (102401 KB)
        $file = UploadedFile::fake()->create('large.sql', 102401);

        $response = $this->postJson('/convert/upload', [
            'file' => $file,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_endpoint_accepts_file_under_100mb(): void
    {
        Storage::fake('local');

        // Create a file under 100MB
        $file = UploadedFile::fake()->createWithContent(
            'medium.sql',
            'CREATE TABLE test (id INT PRIMARY KEY);'
        );

        $response = $this->postJson('/convert/upload', [
            'file' => $file,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }


    public function test_accepts_27kb_string(): void
    {
        // Approximately 27KB string
        $str = str_repeat('A', 27 * 1024);

        $response = $this->postJson('/convert', [
            'mysql_dump' => $str,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        // Should return 422 because it's not valid SQL, but NOT a validation error for length
        $response->assertStatus(422);
        
        $json = $response->json();
        if (isset($json['errors']['mysql_dump'])) {
            $this->fail('Should not have validation errors for 27KB string');
        }
    }
}
