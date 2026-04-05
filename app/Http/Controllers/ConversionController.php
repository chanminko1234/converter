<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\ValidationException;

class ConversionController extends Controller
{
    /**
     * Convert MySQL dump to specified format
     */
    public function convert(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mysql_dump' => 'required|string|max:102400000', // 100MB character limit
            'target_format' => 'required|string|in:postgresql,csv,xlsx,xls,sqlite,psql',
            'options' => 'sometimes|array',
            'options.preserve_identity' => 'sometimes|boolean',
            'options.handle_enums' => 'sometimes|string|in:varchar,check_constraint,enum_table',
            'options.handle_sets' => 'sometimes|string|in:varchar,array,separate_table',
            'options.timezone_handling' => 'sometimes|string|in:utc,local,preserve',
            'options.trigger_handling' => 'sometimes|string|in:convert,comment,skip',
            'options.replace_handling' => 'sometimes|string|in:upsert,insert_ignore,error',
            'options.ignore_handling' => 'sometimes|string|in:on_conflict_ignore,skip,error',
            'options.schema_only' => 'sometimes|boolean',
            'options.predictive_refactoring' => 'sometimes|boolean',
            'options.predictiveRefactoring' => 'sometimes|boolean',
            'options.auto_cleaning' => 'sometimes|boolean',
            'options.autoCleaning' => 'sometimes|boolean',
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
            'options.dataMasking' => 'sometimes|boolean',
            'options.data_masking' => 'sometimes|boolean',
            'options.framework_preset' => 'sometimes|string|in:none,wordpress,laravel,magento',
            'options.frameworkPreset' => 'sometimes|string|in:none,wordpress,laravel,magento',
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
            if (empty($parsedData['tables']) && !$parsedData['has_valid_sql_keywords']) {
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
        // Handle options parameter - it comes as JSON string from FormData
        $optionsInput = $request->input('options', '[]');
        $options = [];
        
        if (is_string($optionsInput)) {
            $options = json_decode($optionsInput, true) ?? [];
        } elseif (is_array($optionsInput)) {
            $options = $optionsInput;
        }
        
        $validator = Validator::make(array_merge($request->all(), ['options' => $options]), [
            'file' => 'required|file|max:102400', // 100MB limit for uploaded file
            'target_format' => 'required|string|in:postgresql,csv,xlsx,xls,sqlite,psql',
            'options' => 'sometimes|array',
            'options.predictive_refactoring' => 'sometimes|boolean',
            'options.predictiveRefactoring' => 'sometimes|boolean',
            'options.auto_cleaning' => 'sometimes|boolean',
            'options.autoCleaning' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        /** @var UploadedFile $file */
        $file = $request->file('file');
        $targetFormat = $request->input('target_format');

        try {
            $parsedData = $this->parseMysqlDump($file);
            
            // Validate that we found some valid SQL structure
            if (empty($parsedData['tables']) && !$parsedData['has_valid_sql_keywords']) {
                throw new \Exception('Invalid SQL syntax or no valid SQL statements found');
            }

            $result = match($targetFormat) {
                'postgresql', 'psql' => $this->convertToPostgreSQL($parsedData, $options),
                'sqlite' => $this->convertToSQLite($parsedData, $options),
                'csv' => $this->convertToCSV($parsedData, $options),
                'xlsx', 'xls' => $this->convertToExcel($parsedData, $targetFormat, $options),
                default => throw new \Exception('Unsupported target format: ' . $targetFormat),
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
                'error' => 'File processing failed: '.$e->getMessage(),
                'code' => 'FILE_PROCESSING_ERROR',
            ], 422);
        }
    }

    /**
     * Stream data directly between MySQL and PostgreSQL
     */
    public function stream(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|array',
            'source.host' => 'required|string',
            'source.port' => 'required|string',
            'source.user' => 'required|string',
            'source.pass' => 'present|string|nullable',
            'source.db' => 'required|string',
            'target' => 'required|array',
            'target.host' => 'required|string',
            'target.port' => 'required|string',
            'target.user' => 'required|string',
            'target.pass' => 'present|string|nullable',
            'target.db' => 'required|string',
            'options' => 'sometimes|array',
            'options.incremental_sync' => 'sometimes|boolean',
            'options.incrementalSync' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $source = $request->input('source');
        $target = $request->input('target');
        $options = $request->input('options', []);

        try {
            // Configure dynamic connections
            Config::set('database.connections.temp_mysql', [
                'driver' => 'mysql',
                'host' => $source['host'],
                'port' => $source['port'],
                'database' => $source['db'],
                'username' => $source['user'],
                'password' => $source['pass'] ?? '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
            ]);

            Config::set('database.connections.temp_pgsql', [
                'driver' => 'pgsql',
                'host' => $target['host'],
                'port' => $target['port'],
                'database' => $target['db'],
                'username' => $target['user'],
                'password' => $target['pass'] ?? '',
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
                'sslmode' => 'prefer',
            ]);

            // Purge connections to ensure new settings are used
            DB::purge('temp_mysql');
            DB::purge('temp_pgsql');

            // Test connections and get tables
            $mysqlTables = DB::connection('temp_mysql')->select("SHOW TABLES");
            if (empty($mysqlTables)) {
                throw new \Exception("No tables found in source database.");
            }
            
            $mysqlDbName = $source['db'];
            $tablesField = "Tables_in_{$mysqlDbName}";

            $report = [];
            $results = [];
            $isIncremental = $options['incrementalSync'] ?? $options['incremental_sync'] ?? false;

            foreach ($mysqlTables as $tableRow) {
                if (!isset($tableRow->$tablesField)) continue;
                $tableName = $tableRow->$tablesField;
                
                // Get CREATE TABLE
                $createRes = DB::connection('temp_mysql')->select("SHOW CREATE TABLE `{$tableName}`");
                $createSql = $createRes[0]->{'Create Table'};

                // Incremental Support Lookup
                $checkpoint = null;
                if ($isIncremental) {
                    $checkpoint = DB::table('migration_checkpoints')
                        ->where('source_db', $source['db'])
                        ->where('target_db', $target['db'])
                        ->where('table_name', $tableName)
                        ->first();
                }
                
                // Parse it
                $parsedData = $this->parseMysqlDump($createSql);
                
                // Apply cleaning and refactoring
                $this->performAutoCleaning($parsedData, $options, $report);
                
                // Convert to PostgreSQL
                $converted = $this->convertToPostgreSQL($parsedData, $options);
                $pgSql = $converted['sql'];
                
                // Create or update table structure (only if no checkpoint exists)
                if (!$checkpoint) {
                   DB::connection('temp_pgsql')->unprepared($pgSql);
                }
                
                // Stream rows with High-Water Mark tracking
                $rowCount = 0;
                $trackCol = 'id';
                
                $query = DB::connection('temp_mysql')->table($tableName);
                if ($checkpoint && $checkpoint->last_value) {
                    $trackCol = $checkpoint->checkpoint_column;
                    $query->where($trackCol, '>', $checkpoint->last_value);
                    $report[] = ['type' => 'info', 'message' => "Sync: Table '{$tableName}' resuming from {$trackCol}={$checkpoint->last_value}."];
                }

                $currentMax = $checkpoint->last_value ?? null;

                $query->orderBy($trackCol)->chunk(1000, function($rows) use ($tableName, &$rowCount, &$currentMax, $trackCol) {
                    $insertData = [];
                    foreach ($rows as $row) {
                        $arr = (array)$row;
                        $insertData[] = $arr;
                        if (isset($arr[$trackCol])) {
                           if (is_null($currentMax) || $arr[$trackCol] > $currentMax) {
                               $currentMax = $arr[$trackCol];
                           }
                        }
                    }
                    
                    if (!empty($insertData)) {
                       DB::connection('temp_pgsql')->table($tableName)->insert($insertData);
                       $rowCount += count($insertData);
                    }
                });
                
                // Persist high-water mark
                if (!is_null($currentMax)) {
                    DB::table('migration_checkpoints')->updateOrInsert(
                        ['source_db' => $source['db'], 'target_db' => $target['db'], 'table_name' => $tableName],
                        ['checkpoint_column' => $trackCol, 'last_value' => (string)$currentMax, 'last_synced_at' => now()]
                    );
                }
                
                $results[] = [
                    'table' => $tableName,
                    'rows_migrated' => $rowCount,
                    'status' => 'success'
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'migrated_tables' => $results,
                    'report' => $report,
                    'sql' => "-- Streaming Migration Completed\n-- " . count($results) . " tables migrated.",
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Streaming migration failed: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Parse MySQL dump into structured data
     */
    private function parseMysqlDump(string|UploadedFile $input): array
    {
        $tables = [];
        $currentTable = null;
        $inCreateTable = false;
        $tableStructure = [];
        $rawDump = '';
        $hasValidSqlKeywords = false;
        $sqlKeywords = ['CREATE', 'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP', 'REPLACE'];

        if ($input instanceof UploadedFile) {
            $fp = fopen($input->getRealPath(), 'r');
        } else {
            $fp = fopen('php://memory', 'r+');
            fwrite($fp, $input);
            rewind($fp);
        }

        while (($line = fgets($fp)) !== false) {
            $trimmedLine = trim($line);
            
            // Skip empty lines and MySQL-specific comments/directives
            if (empty($trimmedLine) || 
                (!$inCreateTable && (
                    preg_match('/^\s*\/\*!.*?\*\/$/', $trimmedLine) ||
                    preg_match('/^\s*SET\s+/', $trimmedLine) ||
                    preg_match('/^\s*DROP\s+TABLE\s+IF\s+EXISTS\s+/', $trimmedLine) ||
                    preg_match('/^\s*(LOCK|UNLOCK)\s+TABLES/', $trimmedLine) ||
                    preg_match('/^\s*\/\*!\d+\s+(DIS|EN)ABLE\s+KEYS\s+\*\//', $trimmedLine)
                )) ||
                preg_match('/^\s*--/', $trimmedLine) ||
                preg_match('/^\s*#/', $trimmedLine)) {
                continue;
            }

            if (!$hasValidSqlKeywords) {
                foreach ($sqlKeywords as $keyword) {
                    if (stripos($trimmedLine, $keyword) !== false) {
                        $hasValidSqlKeywords = true;
                        break;
                    }
                }
            }

            // Handle ALTER TABLE for foreign keys
            if (preg_match('/^\s*ALTER\s+TABLE\s+`?([^`\s\(]+)`?\s+ADD\s+(?:CONSTRAINT\s+`?[^`\s\(]+`?\s+)?FOREIGN\s+KEY\s*\(`?([^`\s\)]+)`?\)\s+REFERENCES\s+`?([^`\s\(]+)`?\s*\(`?([^`\s\)]+)`?\)/i', $trimmedLine, $matches)) {
                $tableName = $matches[1];
                $column = $matches[2];
                $refTable = $matches[3];
                $refColumn = $matches[4];
                
                if (isset($tables[$tableName])) {
                    $tables[$tableName]['foreign_keys'][] = [
                        'column' => $column,
                        'references_table' => $refTable,
                        'references_column' => $refColumn
                    ];
                }
                continue;
            }

            // Capture INSERT or REPLACE statements or other standalone statements to raw_dump
            if (!$inCreateTable && 
                !preg_match('/^\s*CREATE\s+TABLE/i', $trimmedLine) && 
                !preg_match('/^\s*ALTER\s+TABLE/i', $trimmedLine)) {
                $rawDump .= $line . "\n";
                // If it's just a regular line (like an INSERT), we might still want to continue to avoid parsing it as a table
                if (preg_match('/^\s*(INSERT|REPLACE|DELETE|UPDATE|TRUNCATE|CALL|DROP|DO|GRANT|REVOKE|COMMIT|ROLLBACK|BEGIN|START|SET)/i', $trimmedLine)) {
                    continue;
                }
            }

            // Handle single-line CREATE TABLE statements with full definition
            if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\((.+)\)\s*(ENGINE|DEFAULT|AUTO_INCREMENT|COMMENT|CHARSET|COLLATE|ROW_FORMAT|KEY_BLOCK_SIZE|MAX_ROWS|MIN_ROWS|PACK_KEYS|DELAY_KEY_WRITE|CHECKSUM|PARTITION|;)/i', $trimmedLine, $matches)) {
                // Single-line CREATE TABLE with full definition
                $tableName = $matches[1];
                $columnsStr = $matches[2];
                $tableStructure = ['name' => $tableName, 'columns' => [], 'indexes' => []];
                
                // Parse columns and foreign keys from the single line
                $columnParts = $this->parseColumnDefinitions($columnsStr);
                foreach ($columnParts as $columnDef) {
                    $columnDef = trim($columnDef);
                    
                    if (preg_match('/^\s*(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\((.+)\)\s*REFERENCES\s+([^(\s]+)\s*\((.+)\)/i', $columnDef, $matches)) {
                        $tableStructure['foreign_keys'][] = [
                            'column' => trim($matches[1], ' ()`'),
                            'references_table' => trim($matches[2], ' ()`'),
                            'references_column' => trim($matches[3], ' ()`')
                        ];
                    } elseif (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                                'pii_tag' => $this->detectPiiTag($colMatches[1])
                            ];
                        }
                    }
                }
                
                $tables[$tableName] = $tableStructure;
                continue;
            }
            
            // Handle single-line CREATE TABLE with opening parenthesis
            if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\(/i', $trimmedLine, $matches)) {
                // CREATE TABLE with opening parenthesis
                $currentTable = $matches[1];
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => [], 'foreign_keys' => []];
                
                // Check if there's more content on the same line after CREATE TABLE
                $remainingLine = preg_replace('/^\s*CREATE\s+TABLE\s+`?[^`\s\(]+`?\s*\(/i', '', $trimmedLine);
                if (!empty(trim($remainingLine)) && $remainingLine !== ');') {
                    // Process the remaining part of the line as a column definition
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                                'pii_tag' => $this->detectPiiTag($colMatches[1])
                            ];
                        }
                    }
                }
                continue;
            } elseif (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s]+)`?/i', $trimmedLine, $matches)) {
                // Handle multi-line CREATE TABLE without opening parenthesis on same line
                $currentTable = $matches[1];
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
                
                // Check for remaining content after table name
                $remainingLine = preg_replace('/^\s*CREATE\s+TABLE\s+`?[^`\s]+`?\s*/i', '', $trimmedLine);
                if (!empty(trim($remainingLine)) && $remainingLine !== '(' && $remainingLine !== ');') {
                    // Process the remaining part as a column definition
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                                'pii_tag' => $this->detectPiiTag($colMatches[1])
                            ];
                        }
                    }
                }
            } elseif ($inCreateTable && !empty(trim($trimmedLine))) {
                // Check if this line ends the CREATE TABLE statement
                if (preg_match('/^\s*\)\s*(ENGINE|DEFAULT|AUTO_INCREMENT|COMMENT|CHARSET|COLLATE|ROW_FORMAT|KEY_BLOCK_SIZE|MAX_ROWS|MIN_ROWS|PACK_KEYS|DELAY_KEY_WRITE|CHECKSUM|PARTITION|;)/i', $trimmedLine) || $trimmedLine === ');') {
                    $inCreateTable = false;
                    if ($currentTable && isset($tableStructure)) {
                        $tables[$currentTable] = $tableStructure;
                        $currentTable = null;
                        $tableStructure = null;
                    }
                } else {
                    // Normalize backticks first for easier matching
                    $cleanLine = str_replace('`', '', $trimmedLine);
                    $columnDef = trim($cleanLine);
                    
                    // Handle PRIMARY KEY lines
                    if (preg_match('/^\s*PRIMARY\s+KEY\s*\((.+)\)/i', $columnDef, $matches)) {
                        $tableStructure['primary_key'] = trim($matches[1], ' ()');
                        continue;
                    }

                    // Handle UNIQUE KEY lines
                    if (preg_match('/^\s*UNIQUE\s+(?:KEY|INDEX)?\s*(\w+)?\s*\((.+)\)/i', $columnDef, $matches)) {
                        $name = $matches[1] ?: 'uk_' . count($tableStructure['indexes']);
                        $tableStructure['indexes'][] = [
                            'type' => 'UNIQUE',
                            'name' => $name,
                            'columns' => trim($matches[2], ' ()')
                        ];
                        continue;
                    }

                    // Handle regular KEY/INDEX lines
                    if (preg_match('/^\s*(?:KEY|INDEX)\s*(\w+)?\s*\((.+)\)/i', $columnDef, $matches)) {
                        $name = $matches[1] ?: 'idx_' . count($tableStructure['indexes']);
                        $tableStructure['indexes'][] = [
                            'type' => 'INDEX',
                            'name' => $name,
                            'columns' => trim($matches[2], ' ()')
                        ];
                        continue;
                    }

                    // Handle FOREIGN KEY lines
                    if (preg_match('/^\s*(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\((.+)\)\s*REFERENCES\s+([^(\s]+)\s*\((.+)\)/i', $columnDef, $matches)) {
                        $tableStructure['foreign_keys'][] = [
                            'column' => trim($matches[1], ' ()'),
                            'references_table' => trim($matches[2], ' ()`'),
                            'references_column' => trim($matches[3], ' ()')
                        ];
                        continue;
                    }

                    // Skip lines that contain CREATE TABLE or just opening parenthesis
                    if (!preg_match('/^CREATE\s+TABLE/i', $columnDef) && !preg_match('/^\s*\(\s*$/', $columnDef)) {
                        if (preg_match('/^(\w+)\s+(.+)$/i', $columnDef, $matches)) {
                            // Column names are already stripped of backticks here
                            $columnName = strtoupper($matches[1]);
                            if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN'])) {
                                $tableStructure['columns'][] = [
                                    'name' => $matches[1],
                                    'definition' => trim($matches[2], ' ,'),
                                    'pii_tag' => $this->detectPiiTag($matches[1])
                                ];
                            }
                        }
                    }
                }
            }
        }
        
        fclose($fp);

        return [
            'tables' => $tables, 
            'raw_dump' => $rawDump, 
            'has_valid_sql_keywords' => $hasValidSqlKeywords
        ];
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
     * Analyze MySQL schema for visualization
     */
    public function analyze(Request $request): JsonResponse
    {
        $mysqlDump = $request->input('mysql_dump', '');
        $options = $request->input('options', []);
        
        $data = $this->parseMysqlDump($mysqlDump);
        $converted = $this->convertToPostgreSQL($data, $options);
        
        return response()->json([
            'success' => true,
            'data' => [
                'schema_meta' => $converted['schema_meta']
            ]
        ]);
    }

    /**
     * Convert to PostgreSQL format
     */
    private function convertToPostgreSQL(array $data, array $options): array
    {
        $postgresql = [];
        
        // Inject MySQL Compatibility: SUBSTRING_INDEX
        $postgresql[] = "CREATE OR REPLACE FUNCTION substring_index(str text, delim text, count integer)\n" .
            "RETURNS text AS \$body\$\n" .
            "DECLARE\n" .
            "    tokens text[];\n" .
            "BEGIN\n" .
            "    tokens := string_to_array(str, delim);\n" .
            "    IF count > 0 THEN\n" .
            "        RETURN array_to_string(tokens[1:count], delim);\n" .
            "    ELSIF count < 0 THEN\n" .
            "        RETURN array_to_string(tokens[(array_length(tokens, 1) + count + 1):array_length(tokens, 1)], delim);\n" .
            "    ELSE\n" .
            "        RETURN '';\n" .
            "    END IF;\n" .
            "END;\n" .
            "\$body\$ LANGUAGE plpgsql IMMUTABLE;\n";

        $report = [];
        $schemaMeta = [];
        $this->performAutoCleaning($data, $options, $report);
        
        $preset = $options['framework_preset'] ?? $options['frameworkPreset'] ?? 'none';
        if ($preset !== 'none') {
            $formattedPreset = $preset === 'wordpress' ? 'WordPress' : ucfirst($preset);
            $report[] = ['type' => 'info', 'message' => "Applying {$formattedPreset} framework optimizations..."];
        }

        foreach ($data['tables'] as $tableName => $table) {
            $quotedTableName = $this->quotePostgreSQLIdentifier($tableName);
            $pgTable = "CREATE TABLE $quotedTableName (\n";
            $items = [];
            $columnsMeta = [];

            foreach ($table['columns'] as $column) {
                // Apply framework specific column overrides
                $column = $this->applyFrameworkColumnOverrides($column, $preset, $tableName);

                $pgColumnDetails = $this->convertMysqlColumnToPostgreSQL($column, $options, $report);
                $quotedColumnName = $this->quotePostgreSQLIdentifier($column['name']);
                $items[] = '  '.$quotedColumnName.' '.$pgColumnDetails;
                
                $columnsMeta[] = [
                    'name' => $column['name'],
                    'original_type' => $column['definition'],
                    'converted_type' => $pgColumnDetails,
                    'pii_tag' => $column['pii_tag'] ?? null
                ];
            }

            $schemaMeta[] = [
                'name' => $tableName,
                'columns' => $columnsMeta,
                'foreign_keys' => $table['foreign_keys'] ?? []
            ];

            // Add Primary Key constraint if present
            if (isset($table['primary_key'])) {
                $pkColumns = array_map(fn($c) => $this->quotePostgreSQLIdentifier(trim($c)), explode(',', $table['primary_key']));
                $items[] = '  PRIMARY KEY (' . implode(', ', $pkColumns) . ')';
            }

            // Add Unique constraints inline or as separate statements
            if (isset($table['indexes'])) {
                foreach ($table['indexes'] as $index) {
                    if ($index['type'] === 'UNIQUE') {
                        $idxColumns = array_map(fn($c) => $this->quotePostgreSQLIdentifier(trim($c)), explode(',', $index['columns']));
                        
                        // Ensure unique constraint name doesn't conflict with table name
                        $constraintName = $index['name'];
                        if (strtolower($constraintName) === strtolower($tableName)) {
                            $constraintName .= '_unique';
                        }
                        $quotedConstraintName = $this->quotePostgreSQLIdentifier($constraintName);
                        
                        $items[] = '  CONSTRAINT ' . $quotedConstraintName . ' UNIQUE (' . implode(', ', $idxColumns) . ')';
                    }
                }
            }

            // Add DROP TABLE statement for idempotency
            $postgresql[] = "DROP TABLE IF EXISTS $quotedTableName CASCADE;";
            
            $pgTable .= implode(",\n", $items)."\n);";
            $postgresql[] = $pgTable;

            // Handle non-unique indexes as separate statements
            if (isset($table['indexes'])) {
                foreach ($table['indexes'] as $index) {
                    if ($index['type'] === 'INDEX') {
                        // In PostgreSQL, index names must be unique across the schema.
                        // MySQL allows identical index names on different tables.
                        $originalName = str_replace('`', '', $index['name']);
                        $uniqueIdxName = "idx_{$tableName}_{$originalName}";
                        
                        // Ensure it doesn't conflict with table name itself
                        if (strtolower($uniqueIdxName) === strtolower($tableName)) {
                            $uniqueIdxName .= '_index';
                        }
                        
                        $quotedIdxName = $this->quotePostgreSQLIdentifier($uniqueIdxName);
                        $idxColumns = array_map(fn($c) => $this->quotePostgreSQLIdentifier(trim($c)), explode(',', $index['columns']));
                        $postgresql[] = "CREATE INDEX $quotedIdxName ON $quotedTableName (" . implode(', ', $idxColumns) . ");";
                    }
                }
            }
        }

        // Process raw dump for MySQL-specific statements
        if (isset($data['raw_dump'])) {
            $fp = fopen('php://memory', 'r+');
            fwrite($fp, $data['raw_dump']);
            rewind($fp);

            while (($line = fgets($fp)) !== false) {
                $trimmed = trim($line);
                if (empty($trimmed) || str_starts_with($trimmed, '--')) {
                    continue;
                }

                // Skip INSERT and REPLACE statements if schema only option is enabled
                if (($options['schema_only'] ?? false) && preg_match('/^\s*(INSERT|REPLACE)\s+/i', $trimmed)) {
                    continue;
                }

                // Apply Data Masking if enabled
                $line = $this->maskSensitiveData($line, $options);
                $trimmed = trim($line);

                // Convert MySQL backticks (`) to PostgreSQL double quotes (") for identifiers
                $converted = preg_replace('/`([^`]+)`/', '"$1"', $line);
                
                // Convert MySQL-style escaped single quotes (\') to PostgreSQL-style ('')
                $converted = str_replace("\\'", "''", $converted);
                
                // Convert MySQL-style escaped double quotes (\") to literal double quotes (")
                // PostgreSQL standard strings do not treat \" as a special sequence.
                $converted = str_replace("\\\"", "\"", $converted);

                // Strip MySQL-specific VIEW clauses (ALGORITHM, DEFINER, SQL SECURITY)
                if (str_contains(strtoupper($converted), 'CREATE') && str_contains(strtoupper($converted), 'VIEW')) {
                    $converted = preg_replace('/CREATE\s+ALGORITHM\s*=\s*[^\s]+\s+DEFINER\s*=\s*[^\s]+\s+SQL\s+SECURITY\s+[^\s]+\s+VIEW/i', 'CREATE VIEW', $converted);
                    // Also catch simpler variations if they exist
                    $converted = preg_replace('/CREATE\s+DEFINER\s*=\s*[^\s]+\s+VIEW/i', 'CREATE VIEW', $converted);
                    $converted = preg_replace('/CREATE\s+ALGORITHM\s*=\s*[^\s]+\s+VIEW/i', 'CREATE VIEW', $converted);
                }

                // Strip MySQL-specific CHARACTER SET, COLLATE, and USING clauses
                // These are often legacy or incompatible with PostgreSQL's system
                $converted = preg_replace('/\s+CHARACTER\s+SET\s+[a-z0-9_]+/i', '', $converted);
                $converted = preg_replace('/\s+COLLATE\s+[a-z0-9_]+/i', '', $converted);
                
                // Specifically for 'USING charset' and 'CHARSET [type]' which often appear in converted views
                // Handle 'convert(expr using charset)' by stripping both convert and using independently
                // to avoid crossing levels in nested calls.
                if (stripos($converted, 'convert(') !== false && stripos($converted, 'using') !== false) {
                    $converted = preg_replace('/convert\s*\(/i', '(', $converted);
                    $converted = preg_replace('/\s+using\s+[a-z0-9_]+\b/i', '', $converted);
                }
                $converted = preg_replace('/\bUSING\s+(?:latin1|utf8|utf8mb4|binary)\b/i', '', $converted);
                $converted = preg_replace('/\bAS\s+CHAR\b/i', 'AS TEXT', $converted);
                $converted = preg_replace('/\bCHARSET\s+[a-z0-9_]+\b/i', '', $converted);
                // Also handle common view conversion patterns like 'AS CHAR CHARSET BINARY'
                $converted = preg_replace('/\bAS\s+TEXT\s+BINARY\b/i', 'AS TEXT', $converted);
                $converted = preg_replace('/\bAS\s+CHAR\s+CHARSET\s+BINARY\b/i', 'AS TEXT', $converted);
                $converted = preg_replace('/\bCHAR\s+CHARSET\s+BINARY\b/i', 'TEXT', $converted);

                // Handle MySQL 'zero dates' which are invalid in PostgreSQL
                // We convert '0000-00-00 00:00:00' and '0000-00-00' to NULL
                $converted = str_replace("'0000-00-00 00:00:00'", "NULL", $converted);
                $converted = str_replace("'0000-00-00'", "NULL", $converted);
                
                // Handle PostgreSQL strict typing for CASE statements with empty strings in date/numeric contexts
                // MySQL's 'ELSE ''' in views should be 'ELSE NULL' for PostgreSQL
                $converted = preg_replace('/\belse\s*\'\'\s*end\b/i', 'else NULL end', $converted);
                $converted = preg_replace('/\belse\s*""\s*end\b/i', 'else NULL end', $converted);

                // Handle PostgreSQL strict typing for the LEFT function
                // MySQL's LEFT(numeric, n) must be explicitly cast to LEFT(numeric::text, n)
                if (stripos($converted, 'left(') !== false) {
                    $converted = preg_replace('/left\(\s*([^,]+)\s*,\s*(\d+)\s*\)/i', 'left($1::text, $2)', $converted);
                }
                
                $handled = false;

                // Handle REPLACE statements
                if (preg_match('/^\s*REPLACE\s+INTO/i', $trimmed)) {
                    $converted = rtrim(trim($converted), ';');
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
                    $postgresql[] = $converted . ';';
                    $handled = true;
                }

                // Handle INSERT IGNORE statements
                if (!$handled && preg_match('/^\s*INSERT\s+IGNORE\s+INTO/i', $trimmed)) {
                    $converted = rtrim(trim($converted), ';');
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
                    $postgresql[] = $converted . ';';
                    $handled = true;
                }

                // Handle triggers based on options
                if (!$handled && preg_match('/^\s*(CREATE\s+TRIGGER|DROP\s+TRIGGER)/i', $trimmed)) {
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
                    $postgresql[] = $converted;
                    $handled = true;
                }

                // Handle existing DROP TABLE/VIEW statements in the source
                // Ensure they use IF EXISTS and CASCADE for PostgreSQL resiliency
                if (!$handled && preg_match('/^\s*DROP\s+(TABLE|VIEW)\s+(?:IF\s+EXISTS\s+)?(.+)$/i', $trimmed, $m)) {
                    $type = strtoupper($m[1]);
                    $name = trim($m[2], " \t\n\r\0\x0B;`\"");
                    $quotedName = $this->quotePostgreSQLIdentifier($name);
                    
                    // Create a resilient drop block that works for both tables and views without errors
                    $converted = "DO $$ BEGIN " .
                                "IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '" . strtolower($name) . "') THEN " .
                                "DROP TABLE \"" . $name . "\" CASCADE; " .
                                "ELSIF EXISTS (SELECT 1 FROM pg_views WHERE viewname = '" . strtolower($name) . "') THEN " .
                                "DROP VIEW \"" . $name . "\" CASCADE; " .
                                "END IF; END $$;";
                    $postgresql[] = $converted;
                    $handled = true;
                }

                if (!$handled) {
                    $postgresql[] = $converted;
                }
            }
            fclose($fp);
        }

        $psqlScript = implode("\n\n", $postgresql);
        $validationScript = $this->generateIntegrityValidationScript($data);

        return [
            'sql' => $psqlScript,
            'validation_sql' => $validationScript,
            'format' => 'postgresql',
            'report' => $report,
            'schema_meta' => $schemaMeta,
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
            'validation_sql' => $psql['validation_sql'] ?? null,
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
     * Quote PostgreSQL identifier if it's a reserved keyword
     */
    private function quotePostgreSQLIdentifier(string $identifier): string
    {
        // Strip backticks first
        $identifier = str_replace('`', '', $identifier);

        // PostgreSQL reserved keywords that need quoting
        $reservedKeywords = [
            'desc', 'asc', 'order', 'group', 'select', 'from', 'where', 'insert', 'update', 'delete',
            'create', 'drop', 'alter', 'table', 'index', 'view', 'database', 'schema', 'user', 'role',
            'grant', 'revoke', 'commit', 'rollback', 'transaction', 'begin', 'end', 'if', 'else',
            'case', 'when', 'then', 'null', 'true', 'false', 'and', 'or', 'not', 'in', 'exists',
            'between', 'like', 'is', 'as', 'on', 'join', 'inner', 'outer', 'left', 'right', 'full',
            'union', 'intersect', 'except', 'distinct', 'all', 'any', 'some', 'having', 'limit',
            'offset', 'fetch', 'for', 'with', 'recursive', 'window', 'partition', 'over', 'row',
            'range', 'rows', 'unbounded', 'preceding', 'following', 'current', 'default', 'constraint',
            'primary', 'foreign', 'key', 'references', 'unique', 'check', 'not', 'null', 'cascade',
            'restrict', 'set', 'action', 'match', 'partial', 'simple', 'full', 'initially', 'deferred',
            'immediate', 'deferrable', 'temporary', 'temp', 'global', 'local', 'preserve', 'delete',
            'rows', 'on', 'commit', 'drop', 'truncate', 'restart', 'continue', 'identity', 'generated',
            'always', 'by', 'stored', 'virtual', 'column', 'add', 'modify', 'change', 'rename', 'to',
            'current_timestamp', 'current_date', 'current_time'
        ];

        // Quoting identifiers that contain uppercase or special characters or are reserved
        if (preg_match('/[A-Z\s\-]/', $identifier) || in_array(strtolower($identifier), $reservedKeywords)) {
            return '"' . $identifier . '"';
        }

        return $identifier;
    }

    /**
     * Convert MySQL column definition to PostgreSQL
     */
    private function convertMysqlColumnToPostgreSQL(array|string $column, array $options, array &$report = []): string
    {
        // Handle both array format (from actual usage) and string format (from unit tests)
        if (is_array($column)) {
            $definition = $column['definition'];
            $columnName = $column['name'] ?? 'unknown';
        } else {
            $definition = $column;
            $columnName = 'unknown';
        }
        $originalDefinition = $definition;
        $isPredictive = $options['predictiveRefactoring'] ?? $options['predictive_refactoring'] ?? false;
        
        // Remove MySQL-specific collations that don't exist in PostgreSQL
        $definition = preg_replace('/\s+COLLATE\s+[a-zA-Z0-9_]+/i', '', $definition);
        
        // Remove MySQL-specific CHARACTER SET clauses that don't exist in PostgreSQL
        $definition = preg_replace('/\s+CHARACTER\s+SET\s+[a-zA-Z0-9_]+/i', '', $definition);
        
        // Remove MySQL-specific COMMENT clauses that don't exist in PostgreSQL column definitions
        $definition = preg_replace('/\s+COMMENT\s+([\'"])[^\1]*\1/i', '', $definition);
        
        // Remove MySQL-specific ON UPDATE clauses that don't exist in PostgreSQL column definitions
        // (PostgreSQL requires triggers for this functionality)
        $definition = preg_replace('/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP(?:\(\d+\))?/i', '', $definition);
        $definition = preg_replace('/\s+ON\s+UPDATE\s+NOW\(\)/i', '', $definition);
        
        // Remove MySQL-specific UNSIGNED keyword that doesn't exist in PostgreSQL
        $definition = preg_replace('/\s+UNSIGNED/i', '', $definition);
        
        // Predictive Refactoring: Suggest TIMESTAMPTZ for TIMESTAMP/DATETIME
        if ($isPredictive && (stripos($definition, 'TIMESTAMP') !== false || stripos($definition, 'DATETIME') !== false)) {
            $report[] = [
                'type' => 'info',
                'message' => "AI Suggestion: Column '{$columnName}' converted to TIMESTAMPTZ (TIMESTAMP WITH TIME ZONE) for better timezone handling."
            ];
        }

        // First, handle DATETIME conversion with timezone options
        if (stripos($definition, 'DATETIME') !== false) {
            $timezoneHandling = $options['timezoneHandling'] ?? $options['timezone_handling'] ?? 'with_timezone';
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
            switch ($options['handleEnums'] ?? $options['handle_enums'] ?? 'check_constraint') {
                case 'enum_table':
                    return 'TEXT /* ENUM converted to separate table */';
                case 'check_constraint':
                case 'varchar':
                default:
                    return 'TEXT';
            }
        }

        // Handle SET types
        if (preg_match('/set\((.+)\)/i', $originalDefinition, $matches)) {
            switch ($options['handleSets'] ?? $options['handle_sets'] ?? 'array') {
                case 'varchar':
                    return 'TEXT';
                case 'separate_table':
                    return 'TEXT /* SET converted to separate table */';
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
            'char' => 'TEXT',
            'varchar' => 'TEXT',
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

        // Handle DOUBLE PRECISION as a special case first to avoid double conversion
        if (preg_match('/\bDOUBLE\s+PRECISION\s*(?:\(\d+(?:,\d+)?\))?/i', $definition)) {
            $converted = preg_replace('/\bDOUBLE\s+PRECISION\s*\(\d+(?:,\d+)?\)/i', 'DOUBLE PRECISION', $definition);
            return trim($converted);
        }
        
        // Predictive Refactoring: UUID for CHAR(36) or VARCHAR(36) named 'id' or ending in '_id'
        if ($isPredictive && 
            preg_match('/\b(CHAR|VARCHAR)\b\s*\(36\)/i', $definition) && 
            (strtolower($columnName) === 'id' || str_ends_with(strtolower($columnName), '_id'))) {
            $report[] = [
                'type' => 'info', 
                'message' => "AI Suggestion: Column '{$columnName}' looks like a UUID. Converted to UUID type for better performance and validation."
            ];
            return 'UUID';
        }

        // Apply type conversions with word boundaries to avoid partial matches
        foreach ($typeMap as $mysql => $postgres) {
            if (preg_match('/\b' . preg_quote($mysql, '/') . '\b/i', $definition)) {
                $converted = preg_replace('/\b' . preg_quote($mysql, '/') . '\b/i', $postgres, $definition);

                // Predictive Refactoring: Report VARCHAR to TEXT conversion
                if ($isPredictive && (stripos($mysql, 'VARCHAR') !== false || stripos($mysql, 'CHAR') !== false) && $postgres === 'TEXT') {
                    $report[] = [
                        'type' => 'info',
                        'message' => "AI Suggestion: PostgreSQL handles TEXT as efficiently as VARCHAR(n). Converted '{$columnName}' to TEXT to avoid 'value too long' errors."
                    ];
                }

                // Critical safety: Convert VARCHAR to TEXT for PostgreSQL
                // PostgreSQL's TEXT has the same performance as VARCHAR but prevents 'value too long' errors.
                if (strtoupper($postgres) === 'VARCHAR') {
                    $converted = preg_replace('/\bVARCHAR\b\s*\(\d+\)/i', 'TEXT', $converted);
                    $postgres = 'TEXT';
                }

                // Remove precision/scale parameters for types that don't support them in PostgreSQL
                // (e.g., INTEGER(10), BIGINT(20), SMALLINT(5), REAL, DOUBLE PRECISION, TEXT)
                $noPrecisionTypes = ['INTEGER', 'BIGINT', 'SMALLINT', 'DOUBLE PRECISION', 'REAL', 'BOOLEAN', 'TEXT', 'UUID'];
                foreach ($noPrecisionTypes as $npType) {
                    if (str_contains(strtoupper($converted), $npType)) {
                        $converted = preg_replace('/\b' . preg_quote($npType, '/') . '\s*\(\d+(?:,\d+)?\)/i', $npType, $converted);
                    }
                }

                // Handle AUTO_INCREMENT and strip precision for SERIAL conversion
                if (str_contains(strtoupper($converted), 'AUTO_INCREMENT')) {
                    if ($options['preserveIdentity'] ?? $options['preserve_identity'] ?? true) {
                        $postgresType = '';
                        if (str_contains($postgres, 'SMALLINT')) $postgresType = 'SMALLSERIAL';
                        elseif (str_contains($postgres, 'BIGINT')) $postgresType = 'BIGSERIAL';
                        else $postgresType = 'SERIAL';
                        
                        // Replace the entire mysql type, precision, and AUTO_INCREMENT with SERIAL
                        // We also remove NOT NULL because SERIAL implies it in PostgreSQL
                        $converted = preg_replace('/^\s*\w+\s*(?:\(\d+(?:,\d+)?\))?\s*(?:NOT\s+NULL\s+)?AUTO_INCREMENT/i', $postgresType, $converted);
                        // If it didn't match the start (rare), just fallback to stripping AUTO_INCREMENT
                        if (str_contains(strtoupper($converted), 'AUTO_INCREMENT')) {
                            $converted = str_ireplace('AUTO_INCREMENT', '', $converted);
                        }
                    } else {
                        $converted = str_ireplace('AUTO_INCREMENT', '', $converted);
                    }
                }

                // Special handling for date/time types to allow NULL even if MySQL set NOT NULL
                // This is required because MySQL's '0000-00-00' is converted to NULL for PostgreSQL
                $dateTimeTypes = ['DATE', 'TIME', 'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP'];
                foreach ($dateTimeTypes as $dtType) {
                    if (str_contains(strtoupper($converted), $dtType)) {
                        $converted = str_ireplace('NOT NULL', '', $converted);
                        break;
                    }
                }

                // Collapse double spaces potentially left by NOT NULL removal
                $converted = preg_replace('/\s+/', ' ', $converted);

                return trim($converted);
            }
        }
        
        // Fallback: Direct DATETIME conversion if not caught above
        if (str_contains(strtoupper($definition), 'DATETIME') || str_contains(strtoupper($definition), 'TIMESTAMP')) {
            $converted = str_ireplace(['DATETIME', 'TIMESTAMP'], 'TIMESTAMP WITH TIME ZONE', $definition);
            
            // Critical fix: If we are converting '0000-00-00' to NULL in data rows,
            // we MUST allow NULL in the schema, even if MySQL said NOT NULL.
            // PostgreSQL does not support zero-dates, so NULL is the only logical equivalent.
            $converted = str_ireplace('NOT NULL', '', $converted);
            
            return trim($converted);
        }
        
        // If no conversion was applied, return the cleaned definition
        return $definition;
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
                case 'enum_table':
                    $columnName = is_array($column) ? $column['name'] : 'column';
                    return "INTEGER REFERENCES {$columnName}_enum(id)";
                case 'check_constraint':
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

    /**
     * Perform Auto-Cleaning analysis on the parsed schema
     */
    private function performAutoCleaning(array $data, array $options, array &$report): void
    {
        if (!($options['autoCleaning'] ?? $options['auto_cleaning'] ?? false)) {
            return;
        }

        $tables = $data['tables'] ?? [];
        $hashes = [];

        foreach ($tables as $name => $table) {
            $name = str_replace('`', '', $name);
            
            // 1. Detect Inconsistent Naming (CamelCase vs SnakeCase)
            $hasSnakeCase = false;
            $hasCamelCase = false;
            $inconsistentCols = [];
            $columns = $table['columns'] ?? [];
            
            foreach ($columns as $column) {
                $colName = str_replace('`', '', $column['name']);
                $isSnake = str_contains($colName, '_');
                $isCamel = preg_match('/[a-z][A-Z]/', $colName);
                
                if ($isSnake) $hasSnakeCase = true;
                if ($isCamel) {
                    $hasCamelCase = true;
                    $inconsistentCols[] = $colName;
                }
            }

            if ($hasSnakeCase && $hasCamelCase) {
                $suggestions = array_map(fn($c) => strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $c)), array_slice($inconsistentCols, 0, 3));
                $suggestionStr = implode(', ', $suggestions) . (count($inconsistentCols) > 3 ? '...' : '');
                
                $report[] = [
                    'type' => 'warning',
                    'message' => "Auto-Cleaning: Table '{$name}' uses mixed naming (snake_case and camelCase). Suggestion: Normalize to snake_case (e.g. {$suggestionStr})."
                ];
            }

            // 2. Detect Redundant/Empty Tables
            if (empty($columns)) {
                 $report[] = [
                    'type' => 'warning',
                    'message' => "Auto-Cleaning: Table '{$name}' has no columns. Possible redundant table or parsing artifact."
                ];
            }

            // 3. Detect duplicate table structures
            // Normalize column definitions for structural comparison (ignore precision for now)
            $normCols = array_map(fn($c) => ['n' => $c['name'], 'd' => preg_replace('/\s+/', ' ', strtoupper($c['definition']))], $columns);
            $structureHash = md5(json_encode($normCols));
            if (isset($hashes[$structureHash])) {
                 $report[] = [
                    'type' => 'info',
                    'message' => "Auto-Cleaning: Table '{$name}' has identical structure to '{$hashes[$structureHash]}'. This may be a redundant duplicate."
                ];
            }
            $hashes[$structureHash] = $name;
        }
    }

    /**
     * Mask sensitive PII (emails, phones) in SQL insert values
     */
    private function maskSensitiveData(string $line, array $options): string
    {
        if (!($options['dataMasking'] ?? $options['data_masking'] ?? false)) {
            return $line;
        }

        // Only handle leaf values in single quotes to avoid breaking SQL structure
        // 1. Mask Emails: 'my-email@test.com' -> 'm***l@t***.com'
        $line = preg_replace_callback('/\'([^\'@\s]+)@([^\'@\s]+\.[^\'@\s]+)\'/', function($m) {
            $user = $m[1];
            $domain = $m[2];
            $maskedUser = (strlen($user) > 2) ? substr($user, 0, 1) . '***' . substr($user, -1) : '***';
            
            // Handle subdomains and long extensions
            $domParts = explode('.', $domain);
            $ext = array_pop($domParts);
            $domBody = implode('.', $domParts);
            $maskedDomain = (strlen($domBody) > 2) ? substr($domBody, 0, 1) . '***' . substr($domBody, -1) : '***';
            
            return "'$maskedUser@$maskedDomain.$ext'";
        }, $line);

        // 2. Mask Phone Numbers: '+1-123-456-7890' -> '+1-123-456-****'
        $line = preg_replace_callback('/\'(\+?[\d\s\-\.\(\)]{7,18})\'/', function($m) {
            $num = $m[1];
            // Only mask if it looks like a phone number (contains at least 7 digits)
            if (preg_match_all('/\d/', $num) >= 7) {
                return "'" . substr($num, 0, strlen($num)-4) . "****'";
            }
            return $m[0];
        }, $line);

        return $line;
    }

    /**
     * Detect if a column likely contains PII (Sensitive Data)
     */
    private function detectPiiTag(string $columnName): ?string
    {
        $name = strtolower(str_replace(['`', '"'], '', $columnName));
        $patterns = [
            'email' => '/email|mail/i',
            'phone' => '/phone|tel|mobile/i',
            'ssn' => '/ssn|social_security|national_id|tax_id/i',
            'address' => '/address|street|city|zip|postal|latitude|longitude/i',
            'credit_card' => '/card|ccv|cvv|credit|billing/i',
            'name' => '/full_name|first_name|last_name|surname|username/i',
            'password' => '/password|pwd|secret|token|hash|key/i',
            'birth' => '/birth|dob|age/i'
        ];

        foreach ($patterns as $tag => $pattern) {
            if (preg_match($pattern, $name)) {
                return strtoupper($tag);
            }
        }
        return null;
    }

    /**
     * Apply specialized Framework presets (WordPress, Laravel, Magento)
     */
    private function applyFrameworkColumnOverrides(array $column, string $preset, string $tableName): array
    {
        if ($preset === 'none') return $column;

        $colName = strtolower($column['name']);
        $def = strtolower($column['definition']);
        $tableName = strtolower($tableName);

        switch ($preset) {
            case 'wordpress':
                // WordPress uses LONGTEXT for everything in wp_posts
                if (str_contains($def, 'longtext')) {
                    $column['definition'] = 'TEXT';
                }
                // Handle legacy WordPress character sets
                if (str_contains($def, 'utf8mb4_unicode_520_ci')) {
                    $column['definition'] = str_replace('utf8mb4_unicode_520_ci', 'UTF8', $column['definition']);
                }
                break;

            case 'laravel':
                // Laravel standard timestamps should be TIMESTAMPTZ for modern apps
                if (in_array($colName, ['created_at', 'updated_at', 'deleted_at', 'email_verified_at', 'remember_token'])) {
                    if (str_contains($def, 'timestamp') || str_contains($def, 'datetime')) {
                        $column['definition'] = 'TIMESTAMPTZ';
                    }
                    if ($colName === 'remember_token' && str_contains($def, 'varchar')) {
                        $column['definition'] = 'VARCHAR(100)';
                    }
                }
                // Handle UNSIGNED BIGINT IDs commonly used in Laravel
                if ($colName === 'id' && str_contains($def, 'bigint') && str_contains($def, 'unsigned')) {
                     // PostgreSQL doesn't have UNSIGNED, but BIGINT is sufficient for the range
                     $column['definition'] = str_replace('unsigned', '', $column['definition']);
                }
                break;

            case 'magento':
                // Magento prices are usually decimal(12,4)
                if (str_contains($colName, 'price') && str_contains($def, 'decimal')) {
                    $column['definition'] = 'NUMERIC(12,4)';
                }
                // Handle complex Magento EAV integer types
                if (str_contains($tableName, 'entity_int') && $colName === 'value' && str_contains($def, 'int')) {
                    $column['definition'] = 'INTEGER';
                }
                break;
        }

        return $column;
    }

    /**
     * Generate Integrity Validation Script (SQL Queries for verifying migrated data)
     */
    private function generateIntegrityValidationScript(array $data): string
    {
        $script = "-- Database Integrity Report & Validation Script\n";
        $script .= "-- Purpose: Verify that row counts and data integrity match the MySQL source\n";
        $script .= "-- Execution: Run this on your new PostgreSQL database\n\n";

        foreach ($data['tables'] as $name => $table) {
            $quotedName = $this->quotePostgreSQLIdentifier($name);
            $script .= "-- Validation for Table: {$name}\n";
            $script .= "SELECT '{$name}' AS table_name, count(*) AS total_rows FROM {$quotedName};\n";

            // Audit numeric columns for sum totals
            $numericCols = collect($table['columns'])->filter(function($col) {
                $def = strtoupper($col['definition']);
                return str_contains($def, 'INT') || str_contains($def, 'DECIMAL') || str_contains($def, 'FLOAT') || str_contains($def, 'DOUBLE');
            })->take(3); // Limit to top 3 numeric cols to avoid huge scripts

            if ($numericCols->isNotEmpty()) {
                $sums = [];
                foreach ($numericCols as $col) {
                    $qCol = $this->quotePostgreSQLIdentifier($col['name']);
                    $sums[] = "SUM({$qCol}) AS sum_{$col['name']}";
                }
                $script .= "SELECT '{$name}' AS table_name, " . implode(", ", $sums) . " FROM {$quotedName};\n";
            }

            // Check for potential orphaned records if foreign keys were present
            if (!empty($table['foreign_keys'])) {
                foreach ($table['foreign_keys'] as $fk) {
                    $refTable = $this->quotePostgreSQLIdentifier($fk['references_table']);
                    $localCol = $this->quotePostgreSQLIdentifier($fk['column']);
                    $refCol = $this->quotePostgreSQLIdentifier($fk['references_column']);
                    
                    $script .= "/* FK Audit (Orphans in {$name} targeting {$fk['references_table']}): */\n";
                    $script .= "SELECT count(*) AS orphan_count FROM {$quotedName} t \n" .
                               "LEFT JOIN {$refTable} r ON t.{$localCol} = r.{$refCol} \n" .
                               "WHERE t.{$localCol} IS NOT NULL AND r.{$refCol} IS NULL;\n";
                }
            }
            $script .= "\n";
        }

        return $script;
    }
}