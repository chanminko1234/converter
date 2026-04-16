<?php

namespace App\Services\DatabaseAdapters;

class SourceAdapterFactory
{
    public function create(string $sourceType): SourceAdapterInterface
    {
        return match (strtolower($sourceType)) {
            'mysql' => app(MysqlSourceAdapter::class),
            'postgresql', 'pgsql', 'postgres' => app(PostgresSourceAdapter::class),
            'sqlite' => app(SqliteSourceAdapter::class),
            'oracle' => app(OracleSourceAdapter::class),
            'sqlserver', 'sqlsrv', 'sql_server' => app(SqlServerSourceAdapter::class),
            default => throw new \InvalidArgumentException("Unsupported source type: {$sourceType}"),
        };
    }
}
