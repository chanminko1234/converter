<?php

namespace App\Services\DatabaseAdapters;

interface SourceAdapterInterface
{
    /**
     * Set up the source connection
     */
    public function setupConnection(array $config): void;

    /**
     * Fetch schema data for all tables
     */
    public function fetchSchema(array $options): array;

    /**
     * Parse raw SQL dump into structured data
     */
    public function parseDump(string|\Illuminate\Http\UploadedFile $dump): array;

    /**
     * Get list of tables in the source database
     */
    public function getTables(): array;

    /**
     * Get data from a specific table for streaming
     */
    public function getTableData(string $tableName, ?string $checkpointCol = null, mixed $lastValue = null): \Illuminate\Support\Collection|\Illuminate\Database\Query\Builder;

    /**
     * Get CREATE TABLE statement for a specific table
     */
    public function getTableSchema(string $tableName): string;
}
