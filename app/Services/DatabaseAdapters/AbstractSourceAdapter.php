<?php

namespace App\Services\DatabaseAdapters;

use App\Services\SQL\SQLParserService;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

abstract class AbstractSourceAdapter implements SourceAdapterInterface
{
    protected SQLParserService $sqlParser;
    protected string $connectionName;

    public function __construct(SQLParserService $sqlParser)
    {
        $this->sqlParser = $sqlParser;
        // Default connection name, can be overridden by children
        $this->connectionName = 'temp_db_adapter_' . strtolower(class_basename($this));
    }

    public function parseDump(string|UploadedFile $dump): array
    {
        // Default to MySQL parser as it's the most robust in this project,
        // but can be overridden for specific dialects.
        $result = $this->sqlParser->parseMysqlDump($dump);
        $result['source_type'] = $this->getSourceType();
        return $result;
    }

    public function getSourceType(): string
    {
        return str_replace('sourceadapter', '', strtolower(class_basename($this)));
    }

    public function getTableData(string $tableName, ?string $checkpointCol = null, mixed $lastValue = null): Builder
    {
        $query = DB::connection($this->connectionName)->table($tableName);
        if ($checkpointCol && $lastValue) {
            $query->where($checkpointCol, '>', $lastValue);
        }
        return $query;
    }

    public function getConnectionName(): string
    {
        return $this->connectionName;
    }
}
