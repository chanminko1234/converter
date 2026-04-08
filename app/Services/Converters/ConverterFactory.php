<?php

namespace App\Services\Converters;

class ConverterFactory
{
    protected PostgreSQLConverter $postgres;
    protected CsvConverter $csv;
    protected SqliteConverter $sqlite;
    protected ExcelConverter $excel;

    public function __construct(
        PostgreSQLConverter $postgres,
        CsvConverter $csv,
        SqliteConverter $sqlite,
        ExcelConverter $excel
    ) {
        $this->postgres = $postgres;
        $this->csv = $csv;
        $this->sqlite = $sqlite;
        $this->excel = $excel;
    }

    public function create(string $format)
    {
        return match (strtolower($format)) {
            'postgresql', 'psql' => $this->postgres,
            'csv' => $this->csv,
            'sqlite' => $this->sqlite,
            'xlsx', 'xls' => $this->excel,
            default => throw new \Exception("Unsupported format: {$format}"),
        };
    }
}
