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
        $this->controller = new ConversionController;
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
            ['VARCHAR(255)', [], 'VARCHAR(255)'],
            ['TEXT', [], 'TEXT'],
            ['LONGTEXT', [], 'TEXT'],
            ['DATETIME', [], 'TIMESTAMP WITH TIME ZONE'],
            ['TIMESTAMP', [], 'TIMESTAMP'],
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
        $this->assertEquals('VARCHAR(255)', $result);

        // Test check constraint conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $enumColumn,
            ['handleEnums' => 'check_constraint'],
        ]);
        $this->assertStringContainsString('VARCHAR(255)', $result);
        $this->assertStringContainsString('CHECK', $result);

        // Test enum table conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $enumColumn,
            ['handleEnums' => 'enum_table'],
        ]);
        $this->assertEquals('VARCHAR(255) /* ENUM converted to separate table */', $result);
    }

    public function test_mysql_column_to_postgresql_set_handling(): void
    {
        $setColumn = "SET('admin', 'user', 'guest')";

        // Test varchar conversion
        $result = $this->callPrivateMethod('convertMysqlColumnToPostgreSQL', [
            $setColumn,
            ['handleSets' => 'varchar'],
        ]);
        $this->assertEquals('VARCHAR(255)', $result);

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
        $this->assertEquals('VARCHAR(255) /* SET converted to separate table */', $result);
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
        $this->assertStringContainsString('TEXT', $result);
        $this->assertStringContainsString('CHECK', $result);
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
}