<?php

namespace App\Services\DatabaseAdapters;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Traits\ValidatesDatabaseHost;

class PostgresSourceAdapter extends AbstractSourceAdapter implements SourceAdapterInterface
{
    use ValidatesDatabaseHost;

    public function setupConnection(array $config): void
    {
        $host = $config['host'];

        // SSRF Protection
        $this->validateHost($host);

        Config::set("database.connections.{$this->connectionName}", [
            'driver' => 'pgsql',
            'host' => $host,
            'port' => $config['port'] ?? 5432,
            'database' => $config['db'],
            'username' => $config['user'],
            'password' => $config['pass'] ?? '',
            'charset' => 'utf8',
            'prefix' => '',
            'schema' => 'public',
            'sslmode' => 'prefer',
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
                // Use the base parseDump which defaults to the SQLParserService's logic
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
            'source_type' => 'postgresql'
        ];
    }

    public function getTables(): array
    {
        $tablesRes = DB::connection($this->connectionName)
            ->select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        
        return array_map(fn($row) => $row->table_name, $tablesRes);
    }

    public function getTableSchema(string $tableName): string
    {
        // Postgres does not have 'SHOW CREATE TABLE'. We reconstruct it from information_schema.
        $columns = DB::connection($this->connectionName)
            ->select("SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
                      FROM information_schema.columns 
                      WHERE table_name = ? AND table_schema = 'public'
                      ORDER BY ordinal_position", [$tableName]);

        if (empty($columns)) return '';

        $colDefs = [];
        foreach ($columns as $col) {
            $def = "\"{$col->column_name}\" {$col->data_type}";
            if ($col->character_maximum_length) {
                $def .= "({$col->character_maximum_length})";
            }
            if ($col->is_nullable === 'NO') {
                $def .= " NOT NULL";
            }
            if ($col->column_default) {
                $def .= " DEFAULT {$col->column_default}";
            }
            $colDefs[] = $def;
        }

        return "CREATE TABLE \"{$tableName}\" (\n  " . implode(",\n  ", $colDefs) . "\n);";
    }
}

