<?php

namespace App\Services\DatabaseAdapters;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class OracleSourceAdapter implements SourceAdapterInterface
{
    use \App\Traits\ValidatesDatabaseHost;

    protected string $connectionName = 'temp_oracle_adapter';

    public function setupConnection(array $config): void
    {
        $host = $config['host'];
        $this->validateHost($host);

        Config::set("database.connections.{$this->connectionName}", [
            'driver' => 'oracle', // Requires laravel-oci8 or similar
            'host' => $host,
            'port' => $config['port'],
            'database' => $config['db'], // Often SID or Service Name
            'username' => $config['user'],
            'password' => $config['pass'] ?? '',
            'charset' => 'AL32UTF8',
            'prefix' => '',
        ]);
        DB::purge($this->connectionName);
    }

    public function fetchSchema(array $options): array
    {
        // 1. Get Tables
        $tablesRes = DB::connection($this->connectionName)->select("SELECT TABLE_NAME FROM USER_TABLES");
        $allTablesData = [];
        
        foreach ($tablesRes as $tableRow) {
            $tableName = $tableRow->TABLE_NAME;
            $allTablesData[$tableName] = [
                'name' => $tableName,
                'columns' => $this->fetchColumns($tableName),
                'primary_key' => $this->fetchPrimaryKey($tableName),
                'indexes' => $this->fetchIndexes($tableName),
                'foreign_keys' => $this->fetchForeignKeys($tableName),
            ];
        }

        return [
            'tables' => $allTablesData,
            'raw_dump' => '',
            'has_valid_sql_keywords' => !empty($allTablesData),
            'source_type' => 'oracle'
        ];
    }

    private function fetchColumns(string $tableName): array
    {
        $cols = DB::connection($this->connectionName)->select(
            "SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE 
             FROM USER_TAB_COLUMNS WHERE TABLE_NAME = ?", [$tableName]
        );
        
        $columns = [];
        foreach ($cols as $col) {
            $definition = $col->DATA_TYPE;
            if ($col->DATA_PRECISION !== null) {
                $definition .= "({$col->DATA_PRECISION},{$col->DATA_SCALE})";
            } elseif ($col->DATA_LENGTH !== null && !in_array($col->DATA_TYPE, ['DATE', 'NUMBER', 'CLOB', 'BLOB'])) {
                $definition .= "({$col->DATA_LENGTH})";
            }
            
            if ($col->NULLABLE === 'N') {
                $definition .= " NOT NULL";
            }

            $columns[] = [
                'name' => $col->COLUMN_NAME,
                'definition' => $definition,
            ];
        }
        return $columns;
    }

    private function fetchPrimaryKey(string $tableName): ?string
    {
        $res = DB::connection($this->connectionName)->select(
            "SELECT cols.COLUMN_NAME 
             FROM USER_CONSTRAINTS cons, USER_CONS_COLUMNS cols 
             WHERE cons.CONSTRAINT_TYPE = 'P' 
               AND cons.CONSTRAINT_NAME = cols.CONSTRAINT_NAME 
               AND cons.TABLE_NAME = ? 
             ORDER BY cols.POSITION", [$tableName]
        );
        
        if (empty($res)) return null;
        return implode(',', array_map(fn($r) => $r->COLUMN_NAME, $res));
    }

    private function fetchIndexes(string $tableName): array
    {
        // Simplistic index fetch
        $res = DB::connection($this->connectionName)->select(
            "SELECT INDEX_NAME, COLUMN_NAME 
             FROM USER_IND_COLUMNS WHERE TABLE_NAME = ? ORDER BY INDEX_NAME, COLUMN_POSITION", [$tableName]
        );
        $indexes = [];
        foreach ($res as $row) {
            $indexes[$row->INDEX_NAME][] = $row->COLUMN_NAME;
        }
        
        return array_map(fn($name, $cols) => [
            'name' => $name,
            'type' => 'INDEX',
            'columns' => implode(',', $cols)
        ], array_keys($indexes), $indexes);
    }

    private function fetchForeignKeys(string $tableName): array
    {
        $res = DB::connection($this->connectionName)->select(
            "SELECT a.CONSTRAINT_NAME, a.COLUMN_NAME, c_pk.TABLE_NAME AS R_TABLE, b.COLUMN_NAME AS R_COLUMN
             FROM USER_CONS_COLUMNS a
             JOIN USER_CONSTRAINTS c ON a.CONSTRAINT_NAME = c.CONSTRAINT_NAME
             JOIN USER_CONSTRAINTS c_pk ON c.R_CONSTRAINT_NAME = c_pk.CONSTRAINT_NAME
             JOIN USER_CONS_COLUMNS b ON c_pk.CONSTRAINT_NAME = b.CONSTRAINT_NAME AND a.POSITION = b.POSITION
             WHERE c.CONSTRAINT_TYPE = 'R' AND a.TABLE_NAME = ?", [$tableName]
        );
        
        return array_map(fn($r) => [
            'column' => $r->COLUMN_NAME,
            'references_table' => $r->R_TABLE,
            'references_column' => $r->R_COLUMN
        ], $res);
    }

    public function getTables(): array
    {
        $res = DB::connection($this->connectionName)->select("SELECT TABLE_NAME FROM USER_TABLES");
        return array_map(fn($r) => $r->TABLE_NAME, $res);
    }

    public function getTableData(string $tableName, ?string $checkpointCol = null, mixed $lastValue = null): \Illuminate\Database\Query\Builder
    {
        $query = DB::connection($this->connectionName)->table($tableName);
        if ($checkpointCol && $lastValue) {
            $query->where($checkpointCol, '>', $lastValue);
        }
        return $query;
    }

    public function getTableSchema(string $tableName): string
    {
        // Oracle doesn't have SHOW CREATE TABLE. We'll generate it.
        $data = $this->fetchSchema([]);
        if (isset($data['tables'][$tableName])) {
            // Very simplistic DDL generation for parsing
            $table = $data['tables'][$tableName];
            $ddl = "CREATE TABLE {$tableName} (\n";
            $cols = array_map(fn($c) => "  {$c['name']} {$c['definition']}", $table['columns']);
            $ddl .= implode(",\n", $cols);
            if ($table['primary_key']) {
                $ddl .= ",\n  PRIMARY KEY ({$table['primary_key']})";
            }
            $ddl .= "\n);";
            return $ddl;
        }
        return "";
    }

    public function parseDump(string|\Illuminate\Http\UploadedFile $input): array
    {
        $dump = $input instanceof \Illuminate\Http\UploadedFile ? file_get_contents($input->getRealPath()) : $input;
        
        // Simple regex-based parser for Oracle DDL
        $tables = [];
        if (preg_match('/CREATE\s+TABLE\s+(\w+)\s*\((.+)\)/is', $dump, $m)) {
            $tableName = $m[1];
            $content = $m[2];
            // Split by comma but respect parentheses
            $lines = preg_split('/,(?![^(]*\))/', $content);
            $cols = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/^(\w+)\s+(.+)$/i', $line, $cm)) {
                    $cols[] = [
                        'name' => $cm[1],
                        'definition' => $cm[2],
                    ];
                }
            }
            $tables[$tableName] = [
                'name' => $tableName,
                'columns' => $cols,
                'indexes' => [],
                'foreign_keys' => [],
            ];
        }
        return [
            'tables' => $tables,
            'raw_dump' => '',
            'has_valid_sql_keywords' => !empty($tables),
            'source_type' => 'oracle'
        ];
    }
}
