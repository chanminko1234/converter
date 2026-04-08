<?php
namespace Tests\Feature;
use Tests\TestCase;
class Debug extends TestCase {
    public function test_schema_only() {
        $mysqlSql = "CREATE TABLE users (id INT PRIMARY KEY);\nINSERT INTO users (id) VALUES (1);";
        $response = $this->postJson('/convert', ['mysql_dump' => $mysqlSql, 'target_format' => 'postgresql', 'options' => ['schema_only' => true]]);
        print_r($response->json('data.sql'));
        $this->assertTrue(true);
    }
}
