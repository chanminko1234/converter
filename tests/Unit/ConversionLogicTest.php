<?php

namespace Tests\Unit;

use App\Services\Converters\PostgreSQLConverter;
use App\Services\SQL\SQLParserService;
use PHPUnit\Framework\TestCase;

class ConversionLogicTest extends TestCase
{
    private SQLParserService $sqlParser;
    private PostgreSQLConverter $pgConverter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlParser = new SQLParserService();
        $this->pgConverter = new PostgreSQLConverter($this->sqlParser);
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
            $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $input], $options);
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
            $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $input], $options);
            $this->assertEquals($expected, $result, "Failed converting {$input} to PostgreSQL");
        }
    }

    public function test_mysql_column_to_postgresql_enum_handling(): void
    {
        $enumColumn = "ENUM('active', 'inactive', 'pending')";

        // Test varchar conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $enumColumn], ['handleEnums' => 'varchar']);
        $this->assertEquals('TEXT', $result);

        // Test check constraint conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $enumColumn], ['handleEnums' => 'check_constraint']);
        $this->assertEquals('TEXT', $result);

        // Test enum table conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $enumColumn], ['handleEnums' => 'enum_table']);
        $this->assertEquals('TEXT /* ENUM converted to separate table */', $result);
    }

    public function test_mysql_column_to_postgresql_set_handling(): void
    {
        $setColumn = "SET('admin', 'user', 'guest')";

        // Test varchar conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $setColumn], ['handleSets' => 'varchar']);
        $this->assertEquals('TEXT', $result);

        // Test array conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $setColumn], ['handleSets' => 'array']);
        $this->assertEquals('TEXT[]', $result);

        // Test separate table conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $setColumn], ['handleSets' => 'separate_table']);
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
            $result = $this->sqlParser->convertMysqlColumnToSqlite($input, $options);
            $this->assertEquals($expected, $result, "Failed converting {$input} to SQLite");
        }
    }

    public function test_timezone_handling_in_datetime_conversion(): void
    {
        $datetimeColumn = 'DATETIME';

        // Test UTC conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $datetimeColumn], ['timezoneHandling' => 'utc']);
        $this->assertEquals('TIMESTAMP WITH TIME ZONE', $result);

        // Test preserve conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => $datetimeColumn], ['timezoneHandling' => 'preserve']);
        $this->assertEquals('TIMESTAMP', $result);
    }

    public function test_bit_type_conversion(): void
    {
        // PostgreSQL conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => 'BIT(8)'], []);
        $this->assertEquals('BIT(8)', $result);

        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => 'BIT(1)'], []);
        $this->assertEquals('BOOLEAN', $result);

        // SQLite conversion
        $result = $this->sqlParser->convertMysqlColumnToSqlite('BIT(8)', []);
        $this->assertEquals('INTEGER', $result);
    }

    public function test_year_type_conversion(): void
    {
        // PostgreSQL conversion
        $result = $this->sqlParser->convertMysqlColumnToPostgreSQL(['name' => 'col', 'definition' => 'YEAR'], []);
        $this->assertEquals('SMALLINT', $result);

        // SQLite conversion
        $result = $this->sqlParser->convertMysqlColumnToSqlite('YEAR', []);
        $this->assertEquals('INTEGER', $result);
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
            ]
        ];

        foreach ($testCases as [$input, $expected]) {
            $result = $this->pgConverter->calculatePgConfig(
                $input['ram_gb'],
                $input['cpu_cores'],
                $input['storage_type'],
                $input['connection_count'],
                $input['volume']
            );

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
            ['NUMBER(10,2)', 'DECIMAL(10,2)'],
            ['DATE', 'TIMESTAMP WITH TIME ZONE'],
            ['CLOB', 'TEXT'],
            ['BLOB', 'BYTEA'],
        ];

        foreach ($testCases as [$input, $expected]) {
            $result = $this->sqlParser->convertOracleColumnToPostgreSQL($input, []);
            $this->assertEquals($expected, $result, "Failed converting Oracle {$input} to PostgreSQL");
        }
    }

    public function test_sql_server_column_to_postgresql(): void
    {
        $testCases = [
            ['VARCHAR', 'TEXT'],
            ['INT', 'INTEGER'],
            ['BIGINT', 'BIGINT'],
            ['BIT', 'BOOLEAN'],
            ['DATETIME2', 'TIMESTAMP WITH TIME ZONE'],
            ['UNIQUEIDENTIFIER', 'UUID'],
        ];

        foreach ($testCases as [$input, $expected]) {
            $result = $this->sqlParser->convertSqlServerColumnToPostgreSQL($input, []);
            $this->assertEquals($expected, $result, "Failed converting SQL Server {$input} to PostgreSQL");
        }
    }
}
