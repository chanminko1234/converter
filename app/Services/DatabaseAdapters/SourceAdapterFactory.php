<?php

namespace App\Services\DatabaseAdapters;

class SourceAdapterFactory
{
    public function create(string $sourceType): SourceAdapterInterface
    {
        return match (strtolower($sourceType)) {
            'mysql' => new MysqlSourceAdapter(),
            'oracle' => new OracleSourceAdapter(),
            'sqlserver', 'sqlsrv', 'sql_server' => new SqlServerSourceAdapter(),
            default => throw new \InvalidArgumentException("Unsupported source type: {$sourceType}"),
        };
    }
}
