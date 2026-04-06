<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class QueryTranslatorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test basic SELECT query translation.
     */
    public function test_translates_basic_select_with_ifnull(): void
    {
        $response = $this->post('/translate-query', [
            'query' => "SELECT id, IFNULL(name, 'N/A') as name FROM `users` WHERE status = 'active';"
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        $this->assertStringContainsString('COALESCE(name, \'N/A\')', $translated);
        $this->assertStringContainsString('"users"', $translated);
        $this->assertStringNotContainsString('`users`', $translated);
    }

    /**
     * Test DATE_SUB and DATE_ADD translation.
     */
    public function test_translates_date_functions(): void
    {
        $response = $this->post('/translate-query', [
            'query' => "SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) AND updated_at < DATE_ADD('2023-01-01', INTERVAL 1 MONTH);"
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        // Check DATE_SUB -> - INTERVAL
        $this->assertStringContainsString('CURRENT_TIMESTAMP - INTERVAL \'1 DAY\'', $translated);
        
        // Check DATE_ADD -> + INTERVAL with cast for literals
        $this->assertStringContainsString('CAST(\'2023-01-01\' AS TIMESTAMP) + INTERVAL \'1 MONTH\'', $translated);
    }

    /**
     * Test SUBSTRING_INDEX and LIMIT translation.
     */
    public function test_translates_substring_index_and_limit(): void
    {
        $response = $this->post('/translate-query', [
            'query' => "SELECT SUBSTRING_INDEX(email, '@', 1) as username FROM users LIMIT 10, 5;"
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        $this->assertStringContainsString('substring_index(email, \'@\', 1)', $translated);
        $this->assertStringContainsString('LIMIT 5 OFFSET 10', $translated);
    }

    /**
     * Test complex aggregation functions.
     */
    public function test_translates_group_concat_and_unix_timestamp(): void
    {
        $response = $this->post('/translate-query', [
            'query' => "SELECT GROUP_CONCAT(name SEPARATOR ';'), UNIX_TIMESTAMP() FROM users;"
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        $this->assertStringContainsString("STRING_AGG(name, ';')", $translated);
        $this->assertStringContainsString("EXTRACT(EPOCH FROM NOW())", $translated);
    }

    /**
     * Test newer functions like DATEDIFF and UTC_TIMESTAMP.
     */
    public function test_translates_datediff_and_utc_timestamp(): void
    {
        $response = $this->post('/translate-query', [
            'query' => "SELECT DATEDIFF(end_date, start_date), UTC_TIMESTAMP() FROM `events`;"
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        $this->assertStringContainsString('((end_date)::date - (start_date)::date)', $translated);
        $this->assertStringContainsString("(NOW() AT TIME ZONE 'UTC')", $translated);
    }

    /**
     * Test complex nested queries and mixed identifiers.
     */
    public function test_translates_complex_nested_query(): void
    {
        $query = "SELECT `u`.`id`, (SELECT GROUP_CONCAT(`role`) FROM `roles` WHERE `user_id` = `u`.`id`) as `user_roles` " .
                 "FROM `users` `u` " .
                 "WHERE `u`.`created_at` > DATE_SUB(NOW(), INTERVAL 7 DAY) " .
                 "LIMIT 0, 100;";

        $response = $this->post('/translate-query', [
            'query' => $query
        ]);

        $response->assertStatus(200);
        $translated = $response->json('translated');

        // Check for double quotes on all identifiers
        $this->assertStringContainsString('"u"."id"', $translated);
        $this->assertStringContainsString('"roles"', $translated);
        
        // Check for GROUP_CONCAT translation
        $this->assertStringContainsString('STRING_AGG("role", \',\')', $translated);
        
        // Check for DATE_SUB
        $this->assertStringContainsString('CURRENT_TIMESTAMP - INTERVAL \'7 DAY\'', $translated);
        
        // Check for LIMIT
        $this->assertStringContainsString('LIMIT 100 OFFSET 0', $translated);
    }
}
