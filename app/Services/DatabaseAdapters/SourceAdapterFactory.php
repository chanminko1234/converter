<?php

namespace App\Services\DatabaseAdapters;

class SourceAdapterFactory
{
    public function create(string $sourceType): SourceAdapterInterface
    {
        return match (strtolower($sourceType)) {
            'mysql' => app(MysqlSourceAdapter::class),
            'oracle' => app(OracleSourceAdapter::class),
            'sqlserver', 'sqlsrv', 'sql_server' => app(SqlServerSourceAdapter::class),
            default => throw new \InvalidArgumentException("Unsupported source type: {$sourceType}"),
        };
    }
}
