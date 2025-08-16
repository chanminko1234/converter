<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ConversionController extends Controller
{
    /**
     * Convert MySQL dump to specified format
     */
    public function convert(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mysql_dump' => 'required|string|max:10485760', // 10MB limit
            'target_format' => 'required|string|in:postgresql,csv,xlsx,xls,sqlite,psql',
            'options' => 'sometimes|array',
            'options.preserve_identity' => 'sometimes|boolean',
            'options.handle_enums' => 'sometimes|string|in:varchar,check_constraint,enum_table',
            'options.handle_sets' => 'sometimes|string|in:varchar,array,separate_table',
            'options.timezone_handling' => 'sometimes|string|in:utc,local,preserve',
            'options.trigger_handling' => 'sometimes|string|in:convert,comment,skip',
            'options.replace_handling' => 'sometimes|string|in:upsert,insert_ignore,error',
            'options.ignore_handling' => 'sometimes|string|in:on_conflict_ignore,skip,error',
            // CSV specific options
            'options.csv_delimiter' => 'sometimes|string|max:1',
            'options.csv_enclosure' => 'sometimes|string|max:1',
            'options.csv_escape' => 'sometimes|string|max:1',
            'options.csv_include_headers' => 'sometimes|boolean',
            // Excel specific options
            'options.excel_sheet_per_table' => 'sometimes|boolean',
            'options.excel_include_metadata' => 'sometimes|boolean',
            // SQLite specific options
            'options.sqlite_foreign_keys' => 'sometimes|boolean',
            'options.sqlite_wal_mode' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $validated = $validator->validated();
        $mysqlDump = $validated['mysql_dump'];
        $targetFormat = $validated['target_format'];
        $options = $validated['options'] ?? [];

        try {
            // Parse MySQL dump
            $parsedData = $this->parseMysqlDump($mysqlDump);
            
            // Validate that we found some valid SQL structure
            if (empty($parsedData['tables']) && !$this->containsValidSqlStatements($mysqlDump)) {
                throw new \Exception('Invalid SQL syntax or no valid SQL statements found');
            }

            // Convert based on target format
            $result = match ($targetFormat) {
                'postgresql' => $this->convertToPostgreSQL($parsedData, $options),
                'psql' => $this->convertToPsqlScript($parsedData, $options),
                'csv' => $this->convertToCsv($parsedData, $options),
                'xlsx' => $this->convertToExcel($parsedData, $options, 'xlsx'),
                'xls' => $this->convertToExcel($parsedData, $options, 'xls'),
                'sqlite' => $this->convertToSqlite($parsedData, $options),
            };

            return response()->json([
                'success' => true,
                'data' => $result,
                'metadata' => [
                    'tables_processed' => count($parsedData['tables'] ?? []),
                    'target_format' => $targetFormat,
                    'processing_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Conversion failed: '.$e->getMessage(),
                'code' => 'CONVERSION_ERROR',
            ], 422);
        }
    }

    /**
     * Handle file upload and convert
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:sql,txt|max:51200', // 50MB limit
            'target_format' => 'required|string|in:postgresql,csv,xlsx,xls,sqlite,psql',
            'options' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        /** @var UploadedFile $file */
        $file = $request->file('file');
        $targetFormat = $request->input('target_format');
        $options = $request->input('options', []);

        try {
            $mysqlDump = file_get_contents($file->getRealPath());

            if ($mysqlDump === false) {
                throw new \Exception('Failed to read uploaded file');
            }

            // Create a new request with the file content
            $convertRequest = new Request([
                'mysql_dump' => $mysqlDump,
                'target_format' => $targetFormat,
                'options' => $options,
            ]);

            return $this->convert($convertRequest);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'File processing failed: '.$e->getMessage(),
                'code' => 'FILE_PROCESSING_ERROR',
            ], 422);
        }
    }

    /**
     * Parse MySQL dump into structured data
     */
    private function parseMysqlDump(string $dump): array
    {
        // Basic MySQL dump parser - this would be expanded with comprehensive parsing logic
        $lines = explode("\n", $dump);
        $tables = [];
        $currentTable = null;
        $inCreateTable = false;
        $tableStructure = [];

        foreach ($lines as $line) {
            $line = trim($line);

            // Handle single-line CREATE TABLE statements
            if (preg_match('/^CREATE TABLE `?([^`\s]+)`?\s*\((.+)\);?$/i', $line, $matches)) {
                $tableName = $matches[1];
                $columnsStr = $matches[2];
                $tableStructure = ['name' => $tableName, 'columns' => [], 'indexes' => []];
                
                // Parse columns from the single line
                $columnParts = $this->parseColumnDefinitions($columnsStr);
                foreach ($columnParts as $columnDef) {
                    $columnDef = trim($columnDef);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                            ];
                        }
                    }
                }
                
                $tables[$tableName] = $tableStructure;
                continue;
            }
            
            // Handle single-line CREATE TABLE with opening parenthesis
            if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\(/i', $line, $matches)) {
                $currentTable = $matches[1];
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
                
                // Check if there's more content on the same line after CREATE TABLE
                $remainingLine = preg_replace('/^\s*CREATE\s+TABLE\s+`?[^`\s\(]+`?\s*\(/i', '', $line);
                if (!empty(trim($remainingLine)) && $remainingLine !== ');') {
                    // Process the remaining part of the line as a column definition
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                            ];
                        }
                    }
                }
            } elseif (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s]+)`?/i', $line, $matches)) {
                // Handle multi-line CREATE TABLE without opening parenthesis on same line
                $currentTable = $matches[1];
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
                
                // Check for remaining content after table name
                $remainingLine = preg_replace('/^\s*CREATE\s+TABLE\s+`?[^`\s]+`?\s*/i', '', $line);
                if (!empty(trim($remainingLine)) && $remainingLine !== '(' && $remainingLine !== ');') {
                    // Process the remaining part as a column definition
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                            ];
                        }
                    }
                }
            } elseif ($inCreateTable && !empty(trim($line)) && $line !== ');') {
                // Parse column definitions in multi-line format
                $columnDef = trim($line);
                // Skip lines that contain CREATE TABLE or just opening parenthesis
                if (!preg_match('/^CREATE\s+TABLE/i', $columnDef) && !preg_match('/^\s*\(\s*$/', $columnDef)) {
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $matches)) {
                        $columnName = strtoupper($matches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $matches[1],
                                'definition' => trim($matches[2], ' ,'),
                            ];
                        }
                    }
                }
            } elseif ($inCreateTable && $line === ');') {
                $inCreateTable = false;
                if ($currentTable) {
                    $tables[$currentTable] = $tableStructure;
                }
            }
        }

        return ['tables' => $tables, 'raw_dump' => $dump];
    }

    /**
     * Parse column definitions from a single-line CREATE TABLE statement
     */
    private function parseColumnDefinitions(string $columnsStr): array
    {
        $columns = [];
        $depth = 0;
        $current = '';
        $inQuotes = false;
        $quoteChar = null;
        
        for ($i = 0; $i < strlen($columnsStr); $i++) {
            $char = $columnsStr[$i];
            
            if (!$inQuotes && ($char === '"' || $char === "'")) {
                $inQuotes = true;
                $quoteChar = $char;
            } elseif ($inQuotes && $char === $quoteChar) {
                $inQuotes = false;
                $quoteChar = null;
            } elseif (!$inQuotes && $char === '(') {
                $depth++;
            } elseif (!$inQuotes && $char === ')') {
                $depth--;
            } elseif (!$inQuotes && $char === ',' && $depth === 0) {
                $columns[] = trim($current);
                $current = '';
                continue;
            }
            
            $current .= $char;
        }
        
        if (trim($current)) {
            $columns[] = trim($current);
        }
        
        return $columns;
    }

    /**
     * Check if the input contains valid SQL statements
     */
    private function containsValidSqlStatements(string $sql): bool
    {
        $sql = trim($sql);
        
        // Check for basic SQL keywords
        $validKeywords = ['CREATE', 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'ALTER', 'DROP', 'REPLACE'];
        
        foreach ($validKeywords as $keyword) {
            if (stripos($sql, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Convert to PostgreSQL format
     */
    private function convertToPostgreSQL(array $data, array $options): array
    {
        $postgresql = [];
        $report = [];

        foreach ($data['tables'] as $tableName => $table) {
            $pgTable = "CREATE TABLE $tableName (\n";
            $columns = [];

            foreach ($table['columns'] as $column) {
                $pgColumn = $this->convertMysqlColumnToPostgreSQL($column, $options);
                $columns[] = '  '.$column['name'].' '.$pgColumn;
            }

            $pgTable .= implode(",\n", $columns)."\n);";
            $postgresql[] = $pgTable;
        }

        // Process raw dump for MySQL-specific statements
        if (isset($data['raw_dump'])) {
            $lines = explode("\n", $data['raw_dump']);
            $additionalSql = [];

            foreach ($lines as $line) {
                $trimmed = trim($line);
                if (empty($trimmed) || str_starts_with($trimmed, '--')) {
                    continue;
                }

                $converted = $line;

                // Handle REPLACE statements
                if (preg_match('/^\s*REPLACE\s+INTO/i', $trimmed)) {
                    switch ($options['replace_handling'] ?? 'upsert') {
                        case 'upsert':
                            $converted = preg_replace('/^\s*REPLACE\s+INTO/i', 'INSERT INTO', $converted);
                            $converted .= ' ON CONFLICT DO UPDATE SET /* Add conflict resolution */';
                            $report[] = ['type' => 'warning', 'message' => 'REPLACE converted to INSERT...ON CONFLICT - manual review needed'];
                            break;
                        case 'insert_ignore':
                            $converted = preg_replace('/^\s*REPLACE\s+INTO/i', 'INSERT INTO', $converted);
                            $converted .= ' ON CONFLICT DO NOTHING';
                            $report[] = ['type' => 'info', 'message' => 'REPLACE converted to INSERT...ON CONFLICT DO NOTHING'];
                            break;
                        case 'error':
                            $converted = '-- ERROR: REPLACE statement not supported: '.$line;
                            $report[] = ['type' => 'error', 'message' => 'REPLACE statement encountered but not converted'];
                            break;
                    }
                    $additionalSql[] = $converted;
                }

                // Handle INSERT IGNORE statements
                if (preg_match('/^\s*INSERT\s+IGNORE\s+INTO/i', $trimmed)) {
                    switch ($options['ignore_handling'] ?? 'on_conflict_ignore') {
                        case 'on_conflict_ignore':
                            $converted = preg_replace('/^\s*INSERT\s+IGNORE\s+INTO/i', 'INSERT INTO', $converted);
                            $converted .= ' ON CONFLICT DO NOTHING';
                            $report[] = ['type' => 'info', 'message' => 'INSERT IGNORE converted to INSERT...ON CONFLICT DO NOTHING'];
                            break;
                        case 'skip':
                            $converted = '-- SKIPPED: '.$line;
                            $report[] = ['type' => 'warning', 'message' => 'INSERT IGNORE statement skipped'];
                            break;
                        case 'error':
                            $converted = '-- ERROR: INSERT IGNORE not supported: '.$line;
                            $report[] = ['type' => 'error', 'message' => 'INSERT IGNORE statement encountered but not converted'];
                            break;
                    }
                    $additionalSql[] = $converted;
                }

                // Handle triggers based on options
                if (preg_match('/^\s*(CREATE\s+TRIGGER|DROP\s+TRIGGER)/i', $trimmed)) {
                    switch ($options['trigger_handling'] ?? 'convert') {
                        case 'comment':
                            $converted = '-- '.$converted;
                            $report[] = ['type' => 'warning', 'message' => 'Trigger commented out - manual review needed'];
                            break;
                        case 'skip':
                            continue 2; // Skip this line entirely
                        case 'convert':
                        default:
                            $report[] = ['type' => 'warning', 'message' => 'Trigger syntax may need manual adjustment for PostgreSQL'];
                            break;
                    }
                    $additionalSql[] = $converted;
                }
            }

            if (! empty($additionalSql)) {
                $postgresql = array_merge($postgresql, $additionalSql);
            }
        }

        return [
            'sql' => implode("\n\n", $postgresql),
            'format' => 'postgresql',
            'report' => $report,
        ];
    }

    /**
     * Convert to psql script format
     */
    private function convertToPsqlScript(array $data, array $options): array
    {
        $psql = $this->convertToPostgreSQL($data, $options);

        // Add comprehensive psql-specific commands
        $psqlCommands = [
            '-- PostgreSQL Script Generated from MySQL',
            '-- Run with: psql -d database_name -f script.sql',
            '-- Generated on: '.date('Y-m-d H:i:s'),
            '',
            '-- Enable error handling and timing',
            '\\set ON_ERROR_STOP on',
            '\\timing on',
            "\\echo 'Starting MySQL to PostgreSQL migration...'",
            '',
            '-- Set client encoding',
            "SET client_encoding = 'UTF8';",
            '',
        ];

        // Add timezone handling if specified
        if (($options['timezone_handling'] ?? 'utc') !== 'preserve') {
            $timezone = ($options['timezone_handling'] ?? 'utc') === 'utc' ? 'UTC' : 'LOCAL';
            $psqlCommands[] = '-- Set timezone';
            $psqlCommands[] = "SET timezone = '{$timezone}';";
            $psqlCommands[] = '';
        }

        // Add transaction wrapper
        $psqlCommands[] = '-- Begin transaction';
        $psqlCommands[] = 'BEGIN;';
        $psqlCommands[] = '';

        $psqlScript = implode("\n", $psqlCommands).$psql['sql'];

        // Add transaction end and summary
        $psqlScript .= "\n\n-- Commit transaction\n";
        $psqlScript .= "COMMIT;\n";
        $psqlScript .= "\n-- Migration completed\n";
        $psqlScript .= "\\echo 'MySQL to PostgreSQL migration completed successfully!'\n";

        return [
            'sql' => $psqlScript,
            'format' => 'psql',
            'report' => $psql['report'] ?? [],
        ];
    }

    /**
     * Convert to CSV format
     */
    private function convertToCsv(array $data, array $options): array
    {
        $csvFiles = [];
        $delimiter = $options['csv_delimiter'] ?? ',';
        $enclosure = $options['csv_enclosure'] ?? '"';
        $escape = $options['csv_escape'] ?? '\\';
        $includeHeaders = $options['csv_include_headers'] ?? true;

        foreach ($data['tables'] as $tableName => $table) {
            $csv = '';

            if ($includeHeaders) {
                $headers = array_map(fn ($col) => $col['name'], $table['columns']);
                $csv .= $this->formatCsvRow($headers, $delimiter, $enclosure, $escape)."\n";
            }

            // Add sample data row (in real implementation, this would come from actual data)
            $sampleRow = array_map(fn ($col) => 'sample_'.strtolower($col['name']), $table['columns']);
            $csv .= $this->formatCsvRow($sampleRow, $delimiter, $enclosure, $escape)."\n";

            $csvFiles[$tableName] = $csv;
        }

        return [
            'files' => $csvFiles,
            'format' => 'csv',
            'archive_name' => 'converted_tables.zip',
        ];
    }

    /**
     * Format a CSV row with proper escaping
     */
    private function formatCsvRow(array $fields, string $delimiter, string $enclosure, string $escape): string
    {
        $escapedFields = [];

        foreach ($fields as $field) {
            $field = str_replace($enclosure, $escape.$enclosure, $field);
            $escapedFields[] = $enclosure.$field.$enclosure;
        }

        return implode($delimiter, $escapedFields);
    }

    /**
     * Convert to Excel format
     */
    private function convertToExcel(array $data, array $options, string $format): array
    {
        $sheetPerTable = $options['excel_sheet_per_table'] ?? true;
        $includeMetadata = $options['excel_include_metadata'] ?? false;

        try {
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet;
            $spreadsheet->removeSheetByIndex(0); // Remove default sheet

            foreach ($data['tables'] as $tableName => $table) {
                $worksheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, $tableName);
                $spreadsheet->addSheet($worksheet);

                // Add headers
                $col = 1;
                foreach ($table['columns'] as $column) {
                    $cellCoordinate = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col).'1';
                    $worksheet->setCellValue($cellCoordinate, $column['name']);
                    $col++;
                }

                // Style headers
                $headerRange = 'A1:'.\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($table['columns'])).'1';
                $worksheet->getStyle($headerRange)->getFont()->setBold(true);
                $worksheet->getStyle($headerRange)->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('E2E8F0');
            }

            // Generate file content
            if ($format === 'xlsx') {
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            } else {
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xls($spreadsheet);
            }

            ob_start();
            $writer->save('php://output');
            $content = ob_get_clean();

            return [
                'content' => base64_encode($content),
                'format' => $format,
                'filename' => 'converted_database.'.$format,
                'mime_type' => $format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.ms-excel',
            ];

        } catch (\Exception $e) {
            throw new \Exception('Excel generation failed: '.$e->getMessage());
        }
    }

    /**
     * Convert to SQLite format
     */
    private function convertToSqlite(array $data, array $options): array
    {
        $sqlite = [];
        $foreignKeys = $options['sqlite_foreign_keys'] ?? false;
        $quoteIdentifiers = $options['sqlite_quote_identifiers'] ?? false;

        if ($foreignKeys) {
            $sqlite[] = 'PRAGMA foreign_keys = ON;';
        }

        foreach ($data['tables'] as $tableName => $table) {
            $tableNameFormatted = $quoteIdentifiers ? "\"$tableName\"" : $tableName;
            $sqliteTable = "CREATE TABLE $tableNameFormatted (\n";
            $columns = [];

            foreach ($table['columns'] as $column) {
                $sqliteColumn = $this->convertMysqlColumnToSqlite($column, $options);
                $columnNameFormatted = $quoteIdentifiers ? '"'.$column['name'].'"' : $column['name'];
                $columns[] = '    '.$columnNameFormatted.' '.$sqliteColumn;
            }

            $sqliteTable .= implode(",\n", $columns)."\n);";
            $sqlite[] = $sqliteTable;
        }

        return [
            'sql' => implode("\n\n", $sqlite),
            'format' => 'sqlite',
        ];
    }

    /**
     * Convert MySQL column to PostgreSQL
     */
    private function convertMysqlColumnToPostgreSQL(array|string $column, array $options): string
    {
        // Handle both array format (from actual usage) and string format (from unit tests)
        if (is_array($column)) {
            $definition = $column['definition'];
        } else {
            $definition = $column;
        }
        $originalDefinition = $definition;
        
        // First, handle DATETIME conversion with timezone options
        if (stripos($definition, 'DATETIME') !== false) {
            $timezoneHandling = $options['timezoneHandling'] ?? 'with_timezone';
            if ($timezoneHandling === 'preserve') {
                $definition = str_ireplace('DATETIME', 'TIMESTAMP', $definition);
            } else {
                $definition = str_ireplace('DATETIME', 'TIMESTAMP WITH TIME ZONE', $definition);
            }
            return $definition;
        }

        // Handle BIT(1) as BOOLEAN
        if (stripos($definition, 'BIT(1)') !== false) {
            return 'BOOLEAN';
        }

        // Handle ENUM types
        if (preg_match('/enum\((.+)\)/i', $originalDefinition, $matches)) {
            switch ($options['handleEnums'] ?? 'check_constraint') {
                case 'varchar':
                    return 'VARCHAR(255)';
                case 'enum_table':
                    return 'VARCHAR(255) /* ENUM converted to separate table */';
                case 'check_constraint':
                default:
                    $values = str_getcsv($matches[1], ',', "'");
                    $checkValues = implode(', ', array_map(fn ($v) => "'{$v}'", $values));
                    $columnName = is_array($column) ? $column['name'] : 'column';

                    return "VARCHAR(255) CHECK ({$columnName} IN ({$checkValues}))";
            }
        }

        // Handle SET types
        if (preg_match('/set\((.+)\)/i', $originalDefinition, $matches)) {
            switch ($options['handleSets'] ?? 'array') {
                case 'varchar':
                    return 'VARCHAR(255)';
                case 'separate_table':
                    return 'VARCHAR(255) /* SET converted to separate table */';
                case 'array':
                default:
                    return 'TEXT[]';
            }
        }

        // Comprehensive type mapping
        $typeMap = [
            // Integer types (order matters - longer matches first)
            'tinyint(1)' => 'BOOLEAN',
            'bigint' => 'BIGINT',
            'mediumint' => 'INTEGER',
            'smallint' => 'SMALLINT',
            'tinyint' => 'SMALLINT',
            'integer' => 'INTEGER',
            'int' => 'INTEGER',

            // String types (order matters - longer matches first)
            'char' => 'CHAR',
            'varchar' => 'VARCHAR',
            'longtext' => 'TEXT',
            'mediumtext' => 'TEXT',
            'tinytext' => 'TEXT',
            'text' => 'TEXT',
            'varbinary' => 'BYTEA',
            'binary' => 'BYTEA',
            'longblob' => 'BYTEA',
            'mediumblob' => 'BYTEA',
            'tinyblob' => 'BYTEA',
            'blob' => 'BYTEA',

            // Numeric types
            'decimal' => 'DECIMAL',
            'numeric' => 'NUMERIC',
            'float' => 'REAL',
            'double' => 'DOUBLE PRECISION',
            'real' => 'REAL',
            'bit' => 'BIT',

            // Date/Time types
            'date' => 'DATE',
            'time' => 'TIME',
            'datetime' => 'TIMESTAMP WITH TIME ZONE',
            'timestamp' => 'TIMESTAMP WITH TIME ZONE',
            'year' => 'SMALLINT',

            // JSON type
            'json' => 'JSONB',
        ];

        // Apply type conversions
        foreach ($typeMap as $mysql => $postgres) {
            if (str_contains(strtolower($definition), strtolower($mysql))) {
                $converted = str_ireplace($mysql, $postgres, $originalDefinition);

                // Handle AUTO_INCREMENT
                if (str_contains(strtoupper($converted), 'AUTO_INCREMENT')) {
                    if ($options['preserveIdentity'] ?? true) {
                        if (str_contains($postgres, 'SMALLINT')) {
                            $converted = str_ireplace($mysql, 'SMALLSERIAL', $originalDefinition);
                            $converted = str_ireplace('AUTO_INCREMENT', '', $converted);
                        } elseif (str_contains($postgres, 'INTEGER')) {
                            $converted = str_ireplace($mysql, 'SERIAL', $originalDefinition);
                            $converted = str_ireplace('AUTO_INCREMENT', '', $converted);
                        } elseif (str_contains($postgres, 'BIGINT')) {
                            $converted = str_ireplace($mysql, 'BIGSERIAL', $originalDefinition);
                            $converted = str_ireplace('AUTO_INCREMENT', '', $converted);
                        }
                    } else {
                        $converted = str_ireplace('AUTO_INCREMENT', '', $converted);
                    }
                }

                return trim($converted);
            }
        }
        
        // Fallback: Direct DATETIME conversion if not caught above
        if (str_contains(strtoupper($originalDefinition), 'DATETIME')) {
            return str_ireplace('DATETIME', 'TIMESTAMP WITH TIME ZONE', $originalDefinition);
        }
        
        // If no conversion was applied, return the original definition
        return $originalDefinition;
    }

    /**
     * Convert MySQL column to SQLite
     */
    private function convertMysqlColumnToSqlite(array|string $column, array $options): string
    {
        // Handle both array format (from actual usage) and string format (from unit tests)
        if (is_array($column)) {
            $definition = strtolower($column['definition']);
            $originalDefinition = $column['definition'];
        } else {
            $definition = strtolower($column);
            $originalDefinition = $column;
        }

        // Handle ENUM types
        if (preg_match('/enum\((.+)\)/i', $originalDefinition, $matches)) {
            switch ($options['handleEnums'] ?? 'varchar') {
                case 'check_constraint':
                    $values = str_getcsv($matches[1], ',', "'");
                    $checkValues = implode(', ', array_map(fn ($v) => "'{$v}'", $values));
                    $columnName = is_array($column) ? $column['name'] : 'column';

                    return "TEXT CHECK ({$columnName} IN ({$checkValues}))";
                case 'enum_table':
                    $columnName = is_array($column) ? $column['name'] : 'column';
                    return "INTEGER REFERENCES {$columnName}_enum(id)";
                case 'varchar':
                default:
                    return 'TEXT';
            }
        }

        // Handle SET types
        if (preg_match('/set\((.+)\)/i', $originalDefinition, $matches)) {
            switch ($options['handleSets'] ?? 'varchar') {
                case 'separate_table':
                    return 'TEXT /* SET converted to separate table */';
                case 'varchar':
                default:
                    return 'TEXT';
            }
        }

        // Handle AUTO_INCREMENT
        $hasAutoIncrement = str_contains(strtoupper($originalDefinition), 'AUTO_INCREMENT');
        if ($hasAutoIncrement && ($options['preserveIdentity'] ?? true)) {
            return 'INTEGER PRIMARY KEY AUTOINCREMENT';
        }

        // SQLite type affinity mapping with comprehensive coverage
        if (str_contains($definition, 'tinyint(1)')) {
            return 'INTEGER';
        } // Boolean as INTEGER in SQLite
        if (str_contains($definition, 'bit')) {
            return 'INTEGER';
        } // BIT types as INTEGER in SQLite
        if (str_contains($definition, 'int') || str_contains($definition, 'serial')) {
            return 'INTEGER';
        }
        if (str_contains($definition, 'blob')) {
            return 'BLOB';
        }
        if (str_contains($definition, 'char') || str_contains($definition, 'text')) {
            return 'TEXT';
        }
        if (str_contains($definition, 'real') || str_contains($definition, 'floa') || str_contains($definition, 'doub')) {
            return 'REAL';
        }
        if (str_contains($definition, 'decimal') || str_contains($definition, 'numeric')) {
            return 'NUMERIC';
        }
        if (str_contains($definition, 'year')) {
            return 'INTEGER';
        } // YEAR type as INTEGER
        if (str_contains($definition, 'date') || str_contains($definition, 'time')) {
            return 'TEXT';
        } // SQLite stores dates as TEXT
        if (str_contains($definition, 'json')) {
            return 'TEXT';
        } // JSON as TEXT in SQLite

        return 'TEXT'; // Default fallback
    }
}