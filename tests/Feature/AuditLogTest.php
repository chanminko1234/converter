<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_log_is_created_on_conversion()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/convert', [
            'mysql_dump' => 'CREATE TABLE test (id INT);',
            'target_format' => 'postgresql',
            'options' => ['dataMasking' => true]
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'convert',
            'resource_type' => 'database',
            'resource_id' => 'postgresql'
        ]);

        $log = AuditLog::where('action', 'convert')->first();
        $this->assertArrayHasKey('options', $log->payload);
        $this->assertTrue($log->payload['options']['dataMasking']);
        $this->assertNotNull($log->ip_address);
    }

    public function test_audit_log_sanitizes_passwords()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/convert/stream', [
            'source' => [
                'host' => 'remote.db',
                'port' => '3306',
                'user' => 'admin',
                'pass' => 'super_secret_password',
                'db' => 'src'
            ],
            'target' => [
                'host' => 'target.db',
                'port' => '5432',
                'user' => 'postgres',
                'pass' => 'another_secret',
                'db' => 'tgt'
            ],
            'options' => []
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'stream_migration'
        ]);

        $log = AuditLog::where('action', 'stream_migration')->first();
        $this->assertEquals('********', $log->payload['source']['pass']);
        $this->assertEquals('********', $log->payload['target']['pass']);
        $this->assertEquals('remote.db', $log->payload['source']['host']);
    }

    public function test_audit_log_records_sandbox_violations()
    {
        $user = User::factory()->create();

        // Attempt a DROP DATABASE (blocked)
        $response = $this->actingAs($user)->postJson('/convert/sandbox', [
            'sql' => 'DROP DATABASE sql_stream;'
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'sandbox_blocked'
        ]);

        $log = AuditLog::where('action', 'sandbox_blocked')->first();
        $this->assertStringContainsString('DROP DATABASE', $log->payload['sql_preview']);
        $this->assertStringContainsString('forbidden keyword', $log->payload['error']);
    }
}
