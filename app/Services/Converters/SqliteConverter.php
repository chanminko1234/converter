<?php

namespace App\Services\Converters;

class SqliteConverter
{
    protected PostgreSQLConverter $postgresConverter;

    public function __construct(PostgreSQLConverter $postgresConverter)
    {
        $this->postgresConverter = $postgresConverter;
    }

    /**
     * Stream conversion of MySQL dump to SQLite
     */
    public function convert($input, array $options, string $sourceType): \Generator
    {
        $schema = ($sourceType === 'mysql') ? $this->postgresConverter->getSqlParser()->parseMysqlDump($input, $options) : ['tables' => []];
        
        $suppressHeader = $options['suppressHeader'] ?? $options['suppress_header'] ?? false;
        
        if (!$suppressHeader) {
            yield "PRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n\n";
        }
        
        foreach ($schema['tables'] as $name => $table) {
            $cols = [];
            foreach ($table['columns'] as $col) {
                $cols[] = "  " . $col['name'] . " " . $this->postgresConverter->getSqlParser()->convertMysqlColumnToSQLite($col, $options);
            }
            yield "CREATE TABLE {$name} (\n" . implode(",\n", $cols) . "\n);\n\n";
        }

        // Finalize transaction
        if (!$suppressHeader) {
            yield "COMMIT;";
        }
    }
}
