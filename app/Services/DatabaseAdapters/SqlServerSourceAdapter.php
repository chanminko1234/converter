<?php

namespace App\Services\DatabaseAdapters;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class SqlServerSourceAdapter extends AbstractSourceAdapter implements SourceAdapterInterface
{
    use \App\Traits\ValidatesDatabaseHost;

    public function setupConnection(array $config): void
    {
        $host = $config['host'];
        $this->validateHost($host);

        Config::set("database.connections.{$this->connectionName}", [
            'driver' => 'sqlsrv',
            'host' => $host,
            'port' => $config['port'],
            'database' => $config['db'],
            'username' => $config['user'],
            'password' => $config['pass'] ?? '',
            'charset' => 'utf8',
            'prefix' => '',
        ]);
        DB::purge($this->connectionName);
    }

    public function fetchSchema(array $options): array
    {
        $tablesRes = DB::connection($this->connectionName)->select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
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
            'source_type' => 'sqlserver'
        ];
    }

    private function fetchColumns(string $tableName): array
    {
        $cols = DB::connection($this->connectionName)->select(
            "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
             FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", [$tableName]
        );
        
        $columns = [];
        foreach ($cols as $col) {
            $definition = $col->DATA_TYPE;
            if ($col->CHARACTER_MAXIMUM_LENGTH !== null) {
                $len = $col->CHARACTER_MAXIMUM_LENGTH == -1 ? 'MAX' : $col->CHARACTER_MAXIMUM_LENGTH;
                $definition .= "({$len})";
            }
            if ($col->IS_NULLABLE === 'NO') {
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
            "SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1
               AND TABLE_NAME = ? 
             ORDER BY ORDINAL_POSITION", [$tableName]
        );
        
        if (empty($res)) return null;
        return implode(',', array_map(fn($r) => $r->COLUMN_NAME, $res));
    }

    private function fetchIndexes(string $tableName): array
    {
        // SQL Server Sys Index query
        $res = DB::connection($this->connectionName)->select(
            "SELECT i.name AS IndexName, c.name AS ColumnName, i.is_unique
             FROM sys.indexes i
             JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
             JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
             WHERE i.object_id = OBJECT_ID(?) AND i.is_primary_key = 0
             ORDER BY i.name, ic.key_ordinal", [$tableName]
        );
        
        $indexes = [];
        foreach ($res as $row) {
            $indexes[$row->IndexName]['cols'][] = $row->ColumnName;
            $indexes[$row->IndexName]['unique'] = $row->is_unique;
        }
        
        return array_map(fn($name, $data) => [
            'name' => $name,
            'type' => $data['unique'] ? 'UNIQUE' : 'INDEX',
            'columns' => implode(',', $data['cols'])
        ], array_keys($indexes), $indexes);
    }

    private function fetchForeignKeys(string $tableName): array
    {
        $res = DB::connection($this->connectionName)->select(
            "SELECT
                f.name AS ForeignKey,
                OBJECT_NAME(f.parent_object_id) AS TableName,
                COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
                OBJECT_NAME(f.referenced_object_id) AS ReferenceTableName,
                COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferenceColumnName
             FROM sys.foreign_keys AS f
             INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
             WHERE f.parent_object_id = OBJECT_ID(?)", [$tableName]
        );
        
        return array_map(fn($r) => [
            'column' => $r->ColumnName,
            'references_table' => $r->ReferenceTableName,
            'references_column' => $r->ReferenceColumnName
        ], $res);
    }

    public function getTables(): array
    {
        $res = DB::connection($this->connectionName)->select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        return array_map(fn($r) => $r->TABLE_NAME, $res);
    }


    public function getTableSchema(string $tableName): string
    {
        $data = $this->fetchSchema([]);
        if (isset($data['tables'][$tableName])) {
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
        
        // Simple regex-based parser for T-SQL DDL
        $tables = [];
        if (preg_match('/CREATE\s+TABLE\s+(\w+)\s*\((.+)\)/is', $dump, $m)) {
            $tableName = $m[1];
            $content = $m[2];
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
            'source_type' => 'sqlserver'
        ];
    }
}
