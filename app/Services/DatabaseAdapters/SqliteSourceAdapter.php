<?php

namespace App\Services\DatabaseAdapters;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Traits\ValidatesDatabaseHost;

class SqliteSourceAdapter extends AbstractSourceAdapter implements SourceAdapterInterface
{
    use ValidatesDatabaseHost;

    public function setupConnection(array $config): void
    {
        $database = $config['database'] ?? $config['db'];

        Config::set("database.connections.{$this->connectionName}", [
            'driver' => 'sqlite',
            'database' => $database,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
        DB::purge($this->connectionName);
    }

    public function fetchSchema(array $options): array
    {
        $tables = $this->getTables();
        $allTablesData = [];
        
        foreach ($tables as $tableName) {
            $createSql = $this->getTableSchema($tableName);
            if ($createSql) {
                $parsed = $this->parseDump($createSql);
                if (isset($parsed['tables'][$tableName])) {
                    $allTablesData[$tableName] = $parsed['tables'][$tableName];
                }
            }
        }

        return [
            'tables' => $allTablesData,
            'raw_dump' => '',
            'has_valid_sql_keywords' => !empty($allTablesData),
            'source_type' => 'sqlite'
        ];
    }

    public function getTables(): array
    {
        $tablesRes = DB::connection($this->connectionName)
            ->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        
        return array_map(fn($row) => $row->name, $tablesRes);
    }

    public function getTableSchema(string $tableName): string
    {
        $res = DB::connection($this->connectionName)
            ->select("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", [$tableName]);
        
        return $res[0]->sql ?? '';
    }
}

