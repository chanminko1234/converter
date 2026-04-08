<?php

namespace App\Services\DatabaseAdapters;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Http\Controllers\ConversionController;
use App\Traits\ValidatesDatabaseHost;

class MysqlSourceAdapter implements SourceAdapterInterface
{
    use ValidatesDatabaseHost;

    protected \App\Services\SQL\SQLParserService $sqlParser;
    protected string $connectionName = 'temp_mysql_adapter';

    public function __construct(\App\Services\SQL\SQLParserService $sqlParser)
    {
        $this->sqlParser = $sqlParser;
    }

    public function setupConnection(array $config): void
    {
        $host = $config['host'];

        // SSRF Protection: Block private IP ranges, local addresses, and cloud metadata IPs
        $this->validateHost($host);

        Config::set("database.connections.{$this->connectionName}", [
            'driver' => 'mysql',
            'host' => $host,
            'port' => $config['port'],
            'database' => $config['db'],
            'username' => $config['user'],
            'password' => $config['pass'] ?? '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
        ]);
        DB::purge($this->connectionName);
    }

    public function fetchSchema(array $options): array
    {
        $dbName = Config::get("database.connections.{$this->connectionName}.database");
        $tablesRes = DB::connection($this->connectionName)->select("SHOW TABLES");
        $tablesField = "Tables_in_{$dbName}";
        
        $allTablesData = [];
        $rawDump = "";
        
        foreach ($tablesRes as $tableRow) {
            if (!isset($tableRow->$tablesField)) continue;
            $tableName = $tableRow->$tablesField;
            
            $createRes = DB::connection($this->connectionName)->select("SHOW CREATE TABLE `{$tableName}`");
            if (!empty($createRes)) {
                $createSql = $createRes[0]->{'Create Table'};
                $parsed = $this->parseDump($createSql);
                if (isset($parsed['tables'][$tableName])) {
                    $allTablesData[$tableName] = $parsed['tables'][$tableName];
                }
            }
        }
        
        return [
            'tables' => $allTablesData,
            'raw_dump' => $rawDump,
            'has_valid_sql_keywords' => !empty($allTablesData),
            'source_type' => 'mysql'
        ];
    }

    public function parseDump(string|\Illuminate\Http\UploadedFile $dump): array
    {
        $result = $this->sqlParser->parseMysqlDump($dump);
        $result['source_type'] = 'mysql';
        return $result;
    }

    public function getTables(): array
    {
        $dbName = Config::get("database.connections.{$this->connectionName}.database");
        $tablesRes = DB::connection($this->connectionName)->select("SHOW TABLES");
        $tablesField = "Tables_in_{$dbName}";
        
        $tables = [];
        foreach ($tablesRes as $tableRow) {
            if (isset($tableRow->$tablesField)) {
                $tables[] = $tableRow->$tablesField;
            }
        }
        return $tables;
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
        $res = DB::connection($this->connectionName)->select("SHOW CREATE TABLE `{$tableName}`");
        return $res[0]->{'Create Table'} ?? '';
    }
}
