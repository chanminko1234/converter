<?php

namespace Tests\Unit;

use App\Http\Controllers\ConversionController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class ConversionLogicTest extends TestCase
{
    private ConversionController $controller;

    private ReflectionClass $reflection;

    protected function setUp(): void
    {
        parent::setUp();
        // Mock services to satisfy constructor
        $gemini = $this->createMock(\App\Services\GeminiService::class);
        $binlog = $this->createMock(\App\Services\BinlogListener::class);
        $this->controller = new ConversionController($gemini, $binlog);
        $this->reflection = new ReflectionClass($this->controller);
    }

    private function callPrivateMethod(string $methodName, array $args = []): mixed
    {
        $method = $this->reflection->getMethod($methodName);
        $method->setAccessible(true);

        return $method->invokeArgs($this->controller, $args);
    }

    public function test_mysql_column_to_postgresql_basic_types(): void
    {
        $testCases = [
            ['INT', [], 'INTEGER'],
            ['BIGINT', [], 'BIGINT'],
            ['TINYINT', [], 'SMALLINT'],
            ['MEDIUMINT', [], 'INTEGER'],
            ['VARCHAR(255)', [], 'TEXT'],
            ['TEXT', [], 'TEXT'],
            ['LONGTEXT', [], 'TEXT'],
            ['DATETIME', [], 'TIMESTAMP WITH TIME ZONE'],
            ['TIMESTAMP', [], 'TIMESTAMP WITH TIME ZONE'],
            ['DOUBLE', [], 'DOUBLE PRECISION'],
            ['FLOAT', [], 'REAL'],
            ['DECIMAL(10,2)', [], 'DECIMAL(10,2)'],
            ['BLOB', [], 'BYTEA'],
            ['LONGBLOB', [], 'BYTEA'],
            ['JSON', [], 'JSONB'],
        ];

        foreach ($testCases as [$input, $options, $expected]) {
            $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [$input, $options]);
            $this->assertEquals($expected, $result, "Failed converting {$input} to PostgreSQL");
        }
    }

    public function test_mysql_column_to_postgresql_auto_increment(): void
    {
        $testCases = [
            ['INT AUTO_INCREMENT', [], 'SERIAL'],
            ['BIGINT AUTO_INCREMENT', [], 'BIGSERIAL'],
            ['SMALLINT AUTO_INCREMENT', [], 'SMALLSERIAL'],
        ];

        foreach ($testCases as [$input, $options, $expected]) {
            $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [$input, $options]);
            $this->assertEquals($expected, $result, "Failed converting {$input} to PostgreSQL");
        }
    }

    public function test_mysql_column_to_postgresql_enum_handling(): void
    {
        $enumColumn = "ENUM('active', 'inactive', 'pending')";

        // Test varchar conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $enumColumn,
            ['handleEnums' => 'varchar'],
        ]);
        $this->assertEquals('TEXT', $result);

        // Test check constraint conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $enumColumn,
            ['handleEnums' => 'check_constraint'],
        ]);
        $this->assertEquals('TEXT', $result);

        // Test enum table conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $enumColumn,
            ['handleEnums' => 'enum_table'],
        ]);
        $this->assertEquals('TEXT /* ENUM converted to separate table */', $result);
    }

    public function test_mysql_column_to_postgresql_set_handling(): void
    {
        $setColumn = "SET('admin', 'user', 'guest')";

        // Test varchar conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $setColumn,
            ['handleSets' => 'varchar'],
        ]);
        $this->assertEquals('TEXT', $result);

        // Test array conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $setColumn,
            ['handleSets' => 'array'],
        ]);
        $this->assertEquals('TEXT[]', $result);

        // Test separate table conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $setColumn,
            ['handleSets' => 'separate_table'],
        ]);
        $this->assertEquals('TEXT /* SET converted to separate table */', $result);
    }

    public function test_mysql_column_to_sqlite_basic_types(): void
    {
        $testCases = [
            ['INT', [], 'INTEGER'],
            ['BIGINT', [], 'INTEGER'],
            ['TINYINT', [], 'INTEGER'],
            ['VARCHAR(255)', [], 'TEXT'],
            ['CHAR(10)', [], 'TEXT'],
            ['TEXT', [], 'TEXT'],
            ['DATETIME', [], 'TEXT'],
            ['TIMESTAMP', [], 'TEXT'],
            ['DOUBLE', [], 'REAL'],
            ['FLOAT', [], 'REAL'],
            ['DECIMAL(10,2)', [], 'NUMERIC'],
            ['BLOB', [], 'BLOB'],
            ['JSON', [], 'TEXT'],
        ];

        foreach ($testCases as [$input, $options, $expected]) {
            $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', [$input, $options]);
            $this->assertEquals($expected, $result, "Failed converting {$input} to SQLite");
        }
    }

    public function test_mysql_column_to_sqlite_auto_increment(): void
    {
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', [
            'INT AUTO_INCREMENT',
            [],
        ]);
        $this->assertEquals('INTEGER PRIMARY KEY AUTOINCREMENT', $result);
    }

    public function test_mysql_column_to_sqlite_enum_handling(): void
    {
        $enumColumn = "ENUM('small', 'medium', 'large')";

        // Test varchar conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', [
            $enumColumn,
            ['handleEnums' => 'varchar'],
        ]);
        $this->assertEquals('TEXT', $result);

        // Test check constraint conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', [
            $enumColumn,
            ['handleEnums' => 'check_constraint'],
        ]);
        $this->assertEquals('TEXT', $result);
    }

    public function test_mysql_column_to_sqlite_set_handling(): void
    {
        $setColumn = "SET('read', 'write', 'execute')";

        // Test varchar conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', [
            $setColumn,
            ['handleSets' => 'varchar'],
        ]);
        $this->assertEquals('TEXT', $result);

        // Test separate table conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', [
            $setColumn,
            ['handleSets' => 'separate_table'],
        ]);
        $this->assertEquals('TEXT /* SET converted to separate table */', $result);
    }

    public function test_timezone_handling_in_datetime_conversion(): void
    {
        $datetimeColumn = 'DATETIME';

        // Test UTC conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $datetimeColumn,
            ['timezoneHandling' => 'utc'],
        ]);
        $this->assertEquals('TIMESTAMP WITH TIME ZONE', $result);

        // Test local conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $datetimeColumn,
            ['timezoneHandling' => 'local'],
        ]);
        $this->assertEquals('TIMESTAMP WITH TIME ZONE', $result);

        // Test preserve conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $datetimeColumn,
            ['timezoneHandling' => 'preserve'],
        ]);
        $this->assertEquals('TIMESTAMP', $result);
    }

    public function test_bit_type_conversion(): void
    {
        // PostgreSQL conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', ['BIT(8)', []]);
        $this->assertEquals('BIT(8)', $result);

        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', ['BIT(1)', []]);
        $this->assertEquals('BOOLEAN', $result);

        // SQLite conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', ['BIT(8)', []]);
        $this->assertEquals('INTEGER', $result);
    }

    public function test_year_type_conversion(): void
    {
        // PostgreSQL conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', ['YEAR', []]);
        $this->assertEquals('SMALLINT', $result);

        // SQLite conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToSqlite', ['YEAR', []]);
        $this->assertEquals('INTEGER', $result);
    }

    public function test_trigger_conversion_resiliency(): void
    {
        $mysqlSql = "CREATE TRIGGER before_insert_users\n" .
                    "BEFORE INSERT ON users\n" .
                    "FOR EACH ROW\n" .
                    "BEGIN\n" .
                    "  SET NEW.created_at = NOW();\n" .
                    "END;";

        // Use a partial data structure for testing convertToPostgreSQL
        $data = ['raw_dump' => $mysqlSql, 'tables' => []];
        $options = ['triggerHandling' => 'convert'];
        $result = $this->callPrivateMethod('convertToPostgreSQL', [$data, $options]);

        $this->assertStringContainsString('CREATE TRIGGER', $result['sql']);
        $reportMessages = array_column($result['report'], 'message');
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'Trigger syntax')));
    }

    public function test_view_conversion_strips_mysql_specifics(): void
    {
        $mysqlSql = "CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW user_emails AS \n" .
                    "SELECT email FROM users WHERE email IS NOT NULL;";

        $data = ['raw_dump' => $mysqlSql, 'tables' => []];
        $result = $this->callPrivateMethod('convertToPostgreSQL', [$data, []]);

        $this->assertStringContainsString('CREATE VIEW', $result['sql']);
        $this->assertStringNotContainsString('ALGORITHM', $result['sql']);
        $this->assertStringNotContainsString('DEFINER', $result['sql']);
        $this->assertStringNotContainsString('SQL SECURITY', $result['sql']);
    }

    public function test_postgresql_config_calculation_logic(): void
    {
        $testCases = [
            // 8GB RAM, 2 Cores, SSD
            [
                ['ram_gb' => 8, 'cpu_cores' => 2, 'storage_type' => 'ssd', 'connection_count' => 100, 'volume' => 50],
                ['shared_buffers' => '2GB', 'effective_cache_size' => '6GB', 'random_page_cost' => 1.1]
            ],
            // 32GB RAM, 8 Cores, HDD
            [
                ['ram_gb' => 32, 'cpu_cores' => 8, 'storage_type' => 'hdd', 'connection_count' => 200, 'volume' => 100],
                ['shared_buffers' => '8GB', 'effective_cache_size' => '24GB', 'random_page_cost' => 4.0]
            ],
            // 4GB RAM, 1 Core, SSD
            [
                ['ram_gb' => 4, 'cpu_cores' => 1, 'storage_type' => 'ssd', 'connection_count' => 50, 'volume' => 10],
                ['shared_buffers' => '1GB', 'effective_cache_size' => '3GB', 'random_page_cost' => 1.1]
            ]
        ];

        foreach ($testCases as [$input, $expected]) {
            $result = $this->callPrivateMethod('calculatePgConfig', [
                $input['ram_gb'],
                $input['cpu_cores'],
                $input['storage_type'],
                $input['connection_count'],
                $input['volume']
            ]);

            $this->assertEquals($expected['shared_buffers'], $result['shared_buffers']);
            $this->assertEquals($expected['effective_cache_size'], $result['effective_cache_size']);
            $this->assertEquals($expected['random_page_cost'], $result['random_page_cost']);
        }
    }

    public function test_oracle_column_to_postgresql(): void
    {
        $testCases = [
            ['VARCHAR2', 'TEXT'],
            ['NUMBER(10)', 'BIGINT'],
            ['NUMBER(19)', 'BIGINT'],
            ['NUMBER(10,2)', 'DECIMAL(10,2)'],
            ['DATE', 'TIMESTAMP WITH TIME ZONE'],
            ['TIMESTAMP', 'TIMESTAMP WITH TIME ZONE'],
            ['CLOB', 'TEXT'],
            ['BLOB', 'BYTEA'],
            ['RAW', 'BYTEA'],
        ];

        foreach ($testCases as [$input, $expected]) {
            $result = $this->callPrivateMethod('convertOracleColumnToPostgreSQL', [$input, []]);
            $this->assertEquals($expected, $result, "Failed converting Oracle {$input} to PostgreSQL");
        }
    }

    public function test_sql_server_column_to_postgresql(): void
    {
        $testCases = [
            ['VARCHAR', 'TEXT'],
            ['NVARCHAR', 'TEXT'],
            ['INT', 'INTEGER'],
            ['BIGINT', 'BIGINT'],
            ['BIT', 'BOOLEAN'],
            ['DATETIME2', 'TIMESTAMP WITH TIME ZONE'],
            ['UNIQUEIDENTIFIER', 'UUID'],
            ['MONEY', 'NUMERIC(19,4)'],
            ['VARBINARY', 'BYTEA'],
        ];

        foreach ($testCases as [$input, $expected]) {
            $result = $this->callPrivateMethod('convertSqlServerColumnToPostgreSQL', [$input, []]);
            $this->assertEquals($expected, $result, "Failed converting SQL Server {$input} to PostgreSQL");
        }
    }
}
