<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostgresConversionFixTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_mysql_to_postgresql_repro_case(): void
    {
        $mysqlSql = "CREATE TABLE `users` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `email` varchar(255) NOT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `email_unique` (`email`)
        ) ENGINE=InnoDB;";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'preserveIdentity' => true,
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        // Repro failures:
        // 1. PRIMARY KEY line might be missing
        // 2. UNIQUE KEY line might be missing
        // 3. Serial might have (11) suffix which is invalid
        // 4. Backticks might remain if quoting logic is weak
        
        $this->assertStringContainsString('id SERIAL', $sql, 'SERIAL conversion failed or has (11) suffix');
        $this->assertStringNotContainsString('SERIAL(11)', $sql, 'SERIAL should not have (11) suffix');
        $this->assertStringContainsString('PRIMARY KEY', $sql, 'Primary key constraint is missing');
        $this->assertStringContainsString('UNIQUE', $sql, 'Unique key constraint is missing');
        $this->assertStringNotContainsString('`', $sql, 'Backticks should be removed');
    }

    public function test_mysql_integer_precision_stripping(): void
    {
        $mysqlSql = "CREATE TABLE `orders` (
          `order_id` int(10) NOT NULL,
          `quantity` smallint(5) DEFAULT NULL,
          `total` bigint(20) DEFAULT NULL
        );";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        $this->assertStringContainsString('order_id INTEGER NOT NULL', $sql);
        $this->assertStringContainsString('quantity SMALLINT DEFAULT NULL', $sql);
        $this->assertStringContainsString('total BIGINT DEFAULT NULL', $sql);
        
        $this->assertStringNotContainsString('INTEGER(10)', $sql);
        $this->assertStringNotContainsString('SMALLINT(5)', $sql);
        $this->assertStringNotContainsString('BIGINT(20)', $sql);
    }

    public function test_mysql_on_update_stripping(): void
    {
        $mysqlSql = "CREATE TABLE `logs` (
          `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'suppress_header' => true
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        $this->assertStringContainsString('updated_at TIMESTAMP WITH TIME ZONE', $sql);
        $this->assertStringContainsString('DEFAULT CURRENT_TIMESTAMP', $sql);
        $this->assertStringNotContainsString('ON UPDATE', $sql);
    }

    public function test_regular_insert_preservation(): void
    {
        $mysqlSql = "INSERT INTO `users` (name, email) VALUES ('John Doe', 'john@example.com');";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        $this->assertStringContainsString("INSERT INTO \"users\" (name, email) VALUES ('John Doe', 'john@example.com');", $sql);
    }

    public function test_mysql_hash_comment_skipping(): void
    {
        $mysqlSql = "
        # Header Comment
        CREATE TABLE `test` (
            `id` int(11), # Inline comment
            `name` varchar(255)
        );
        # Footer Comment
        ";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        $this->assertStringNotContainsString('# Header Comment', $sql);
        $this->assertStringNotContainsString('# Footer Comment', $sql);
        // Note: Inline comments after actual code on the same line are not handled by the line-trimmer
        // but line-start comments are definitely handled now.
    }

    public function test_mysql_single_quote_escaping(): void
    {
        $mysqlSql = "INSERT INTO `countries` (`name`) VALUES ('Ivory Coast / Cote d\'Ivoire');";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        $this->assertStringContainsString("INSERT INTO \"countries\" (\"name\") VALUES ('Ivory Coast / Cote d''Ivoire');", $sql);
        $this->assertStringNotContainsString("\\'", $sql);
    }

    public function test_mysql_reserved_keyword_quoting(): void
    {
        $mysqlSql = "INSERT INTO `orders` (`from`, `to`, `quantity`) VALUES ('Japan', 'USA', 10);";

        $response = $this->actingAs($this->user)->postJson('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $sql = $data['data']['sql'];

        $this->assertStringContainsString('INSERT INTO "orders" ("from", "to", "quantity") VALUES (\'Japan\', \'USA\', 10);', $sql);
    }
}
