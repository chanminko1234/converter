<?php

namespace Tests\Unit;

use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\DatabaseAdapters\MysqlSourceAdapter;
use App\Services\DatabaseAdapters\OracleSourceAdapter;
use App\Services\DatabaseAdapters\SqlServerSourceAdapter;
use Tests\TestCase;

class SourceAdapterTest extends TestCase
{
    /**
     * Test the SourceAdapterFactory creates the correct adapters
     */
    public function test_factory_creates_correct_adapters(): void
    {
        $factory = app(SourceAdapterFactory::class);
        $this->assertInstanceOf(MysqlSourceAdapter::class, $factory->create('mysql'));
        $this->assertInstanceOf(OracleSourceAdapter::class, $factory->create('oracle'));
        $this->assertInstanceOf(SqlServerSourceAdapter::class, $factory->create('sqlserver'));
        $this->assertInstanceOf(SqlServerSourceAdapter::class, $factory->create('sqlsrv'));
    }

    /**
     * Test the factory throws exception for unsupported source types
     */
    public function test_factory_throws_exception_for_unsupported_type(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(SourceAdapterFactory::class)->create('invalid_db');
    }

    /**
     * Test MySQL adapter parsing metadata
     */
    public function test_mysql_adapter_metadata(): void
    {
        $adapter = app(SourceAdapterFactory::class)->create('mysql');
        $ddl = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));";
        
        $parsed = $adapter->parseDump($ddl);
        
        $this->assertEquals('mysql', $parsed['source_type'] ?? null);
        $this->assertArrayHasKey('users', $parsed['tables']);
        $this->assertCount(2, $parsed['tables']['users']['columns']);
    }

    /**
     * Test Oracle adapter parsing metadata (Skeleton)
     */
    public function test_oracle_adapter_metadata(): void
    {
        $adapter = app(SourceAdapterFactory::class)->create('oracle');
        $ddl = "CREATE TABLE employees (id NUMBER PRIMARY KEY, first_name VARCHAR2(50));";
        
        $parsed = $adapter->parseDump($ddl);
        
        $this->assertEquals('oracle', $parsed['source_type'] ?? null);
        $this->assertArrayHasKey('employees', $parsed['tables']);
        $this->assertEquals('id', $parsed['tables']['employees']['columns'][0]['name']);
        $this->assertEquals('NUMBER PRIMARY KEY', $parsed['tables']['employees']['columns'][0]['definition']);
    }

    /**
     * Test SQL Server adapter parsing metadata (Skeleton)
     */
    public function test_sql_server_adapter_metadata(): void
    {
        $adapter = app(SourceAdapterFactory::class)->create('sqlserver');
        $ddl = "CREATE TABLE products (pid INT PRIMARY KEY, title NVARCHAR(100));";
        
        $parsed = $adapter->parseDump($ddl);
        
        $this->assertEquals('sqlserver', $parsed['source_type'] ?? null);
        $this->assertArrayHasKey('products', $parsed['tables']);
        $this->assertEquals('pid', $parsed['tables']['products']['columns'][0]['name']);
    }
}
