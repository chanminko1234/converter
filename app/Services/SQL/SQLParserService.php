<?php

namespace App\Services\SQL;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use PHPSQLParser\PHPSQLParser;
use PHPSQLParser\PHPSQLCreator;
use Faker\Factory as FakerFactory;

class SQLParserService
{
    protected $faker;
    protected $sqlParser;

    public function __construct()
    {
        $this->faker = FakerFactory::create();
        $this->sqlParser = new PHPSQLParser();
    }

    /**
     * Parse MySQL Dump to extract schema metadata
     */
    public function parseMysqlDump(string|UploadedFile $input, array $options = []): array
    {
        $tables = [];
        $currentTable = null;
        $inCreateTable = false;
        $tableStructure = ['name' => '', 'columns' => [], 'indexes' => [], 'foreign_keys' => [], 'constraints' => []];
        $hasValidSqlKeywords = false;
        $sqlKeywords = ['CREATE', 'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP', 'REPLACE', 'TABLE'];

        $fp = $this->openSqlStream($input);

        while (($line = fgets($fp)) !== false) {
            $trimmedLine = trim($line);
            if (empty($trimmedLine) || preg_match('/^\s*(#|--|\/\*)/', $trimmedLine))
                continue;

            foreach ($sqlKeywords as $keyword) {
                if (stripos($trimmedLine, $keyword) !== false) {
                    $hasValidSqlKeywords = true;
                    break;
                }
            }

            if (!$inCreateTable) {
                if (preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([^`"\s\(]+)[`"]?\s*\(/i', $trimmedLine, $m)) {
                    $currentTable = $m[1];
                    $inCreateTable = true;
                    $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => [], 'foreign_keys' => [], 'constraints' => []];

                    if (preg_match('/\((.+)\)\s*[a-z0-9_=\s]*;?$/i', $trimmedLine, $content)) {
                        $this->parseTableInner($content[1], $tableStructure, $options);
                        $tables[$currentTable] = $tableStructure;
                        $inCreateTable = false;
                    }
                } elseif (preg_match('/ALTER\s+TABLE\s+[`"]?([^`"\s\(]+)[`"]?\s+ADD\s+(?:CONSTRAINT\s+[^\s]+\s+)?FOREIGN\s+KEY\s*\((.+)\)\s*REFERENCES\s+[`"]?([^`"\s\(]+)[`"]?\s*\((.+)\)/i', $trimmedLine, $fk)) {
                    $tableName = $fk[1];
                    if (isset($tables[$tableName])) {
                        $tables[$tableName]['foreign_keys'][] = [
                            'column' => trim($fk[2], '`" '),
                            'references_table' => trim($fk[3], '`" '),
                            'references_column' => trim($fk[4], '`" ')
                        ];
                    }
                }
            } else {
                if (preg_match('/^\s*\)\s*[^\(;]*;?$/i', $trimmedLine) || preg_match('/^\s*\)\s*(ENGINE|DEFAULT|;|AUTO_INCREMENT|CHARSET)/i', $trimmedLine)) {
                    $tables[$currentTable] = $tableStructure;
                    $inCreateTable = false;
                } else {
                    $this->parseTableInner($trimmedLine, $tableStructure, $options);
                }
            }
        }
        fclose($fp);
        return ['tables' => $tables, 'has_valid_sql_keywords' => $hasValidSqlKeywords, 'raw_dump' => ''];
    }

    protected function parseTableInner(string $inner, array &$tableStructure, array $options): void
    {
        $entries = $this->splitSqlValues($inner, '(', ')');
        foreach ($entries as $entry) {
            $entry = trim($entry);
            if (empty($entry))
                continue;

            $upperLine = strtoupper($entry);

            if (str_starts_with($upperLine, 'PRIMARY KEY')) {
                if (preg_match('/PRIMARY\s+KEY\s*\((.+)\)/i', $entry, $pk)) {
                    $tableStructure['primary_key'] = trim($pk[1], '`" ');
                }
            } elseif (str_starts_with($upperLine, 'FOREIGN KEY') || str_contains($upperLine, 'CONSTRAINT') && str_contains($upperLine, 'FOREIGN KEY')) {
                if (preg_match('/FOREIGN\s+KEY\s*\((.+)\)\s*REFERENCES\s+[`"]?([^`"\s\(]+)[`"]?\s*\((.+)\)/i', $entry, $fk)) {
                    $tableStructure['foreign_keys'][] = [
                        'column' => trim($fk[1], '`" '),
                        'references_table' => trim($fk[2], '`" '),
                        'references_column' => trim($fk[3], '`" ')
                    ];
                }
            } elseif (str_starts_with($upperLine, 'UNIQUE')) {
                if (preg_match('/UNIQUE\s*(?:KEY|INDEX)?\s*(?:[`"\w]+\s*)?\((.+)\)/i', $entry, $u)) {
                    $tableStructure['constraints'][] = "UNIQUE (" . trim($u[1], '`" ') . ")";
                }
            } else {
                $clean = trim(str_replace('`', '', $entry), ' ,');
                if (preg_match('/^(\w+)\s+(.+)$/is', $clean, $m)) {
                    $colName = $m[1];
                    $colDef = $m[2];
                    $column = ['name' => $colName, 'definition' => $colDef, 'original_type' => $colDef, 'pii_tag' => $this->detectPiiTag($colName)];
                    $preset = $options['frameworkPreset'] ?? $options['framework_preset'] ?? null;
                    if ($preset)
                        $column = $this->applyFrameworkColumnOverrides($column, $preset, $tableStructure['name']);
                    $tableStructure['columns'][] = $column;
                }
            }
        }
    }

    public function convertMysqlColumnToPostgreSQL(array|string $column, array $options, array &$report = []): string
    {
        if (is_array($column)) {
            $definition = $column['definition'];
            $columnName = $column['name'];
        } else {
            $definition = $column;
            $columnName = 'unknown';
        }

        if (isset($options['predictiveRefactoring']) && $options['predictiveRefactoring'] || isset($options['predictive_refactoring']) && $options['predictive_refactoring'] || isset($options['dataMasking']) && $options['dataMasking']) {
            if (stripos($definition, 'TEXT') !== false || stripos($definition, 'LONGTEXT') !== false) {
                $report[] = ['type' => 'info', 'message' => "Suggestion for column '$columnName': Consider using JSONB if this field stores structured data."];
            }
        }

        $definition = preg_replace('/\s+COLLATE\s+[a-zA-Z0-9_]+/i', '', $definition);
        $definition = preg_replace('/\bUNSIGNED\b/i', '', $definition);

        $boundaries = ['NOT NULL', 'NULL', 'DEFAULT', 'AUTO_INCREMENT', 'PRIMARY KEY', 'UNIQUE', 'CHECK', 'COMMENT'];
        $splitPos = -1;
        foreach ($boundaries as $boundary) {
            $pos = stripos($definition, $boundary);
            if ($pos !== false && ($splitPos === -1 || $pos < $splitPos))
                $splitPos = $pos;
        }

        $typePart = ($splitPos !== -1) ? substr($definition, 0, $splitPos) : $definition;
        $attrPart = ($splitPos !== -1) ? substr($definition, $splitPos) : '';

        if (($options['predictiveRefactoring'] ?? $options['predictive_refactoring'] ?? false) && $columnName === 'id' && stripos($typePart, 'CHAR(36)') !== false) {
            $report[] = ['type' => 'info', 'message' => "AI Suggestion for column '$columnName': Primary key CHAR(36) detected. Consider converting to UUID for better performance."];
            if ($options['applyAiRefactoring'] ?? $options['apply_ai_refactoring'] ?? false) {
                $typePart = 'UUID';
                $report[] = ['type' => 'info', 'message' => "Applied: Converted '$columnName' to UUID."];
            }
        }

        $isHandled = false;
        if (preg_match('/\b(DATETIME|TIMESTAMP)\b/i', $typePart)) {
            $pgType = (($options['timezoneHandling'] ?? $options['timezone_handling'] ?? 'with_timezone') === 'preserve') ? 'TIMESTAMP' : 'TIMESTAMP WITH TIME ZONE';
            if ($pgType === 'TIMESTAMP WITH TIME ZONE') {
                $report[] = ['type' => 'info', 'message' => "Column '$columnName': Converted to TIMESTAMPTZ for global scaling."];
            }
            $typePart = preg_replace('/\b(DATETIME|TIMESTAMP)\b/i', $pgType, $typePart);
            $attrPart = str_ireplace('NOT NULL', '', $attrPart);
            $isHandled = true;
        }

        if (!$isHandled) {
            $typeMap = ['tinyint(1)' => 'BOOLEAN', 'bigint' => 'BIGINT', 'mediumint' => 'INTEGER', 'smallint' => 'SMALLINT', 'tinyint' => 'SMALLINT', 'integer' => 'INTEGER', 'int' => 'INTEGER', 'char' => 'TEXT', 'varchar' => 'TEXT', 'longtext' => 'TEXT', 'mediumtext' => 'TEXT', 'tinytext' => 'TEXT', 'text' => 'TEXT', 'varbinary' => 'BYTEA', 'binary' => 'BYTEA', 'longblob' => 'BYTEA', 'mediumblob' => 'BYTEA', 'tinyblob' => 'BYTEA', 'blob' => 'BYTEA', 'decimal' => 'DECIMAL', 'numeric' => 'NUMERIC', 'float' => 'REAL', 'double' => 'DOUBLE PRECISION', 'real' => 'REAL', 'bit' => 'BIT', 'date' => 'DATE', 'time' => 'TIME', 'year' => 'SMALLINT', 'json' => 'JSONB'];

            if (preg_match('/BIT\s*\(\s*1\s*\)/i', $typePart)) {
                $typePart = "BOOLEAN";
                $isHandled = true;
            } elseif (preg_match('/ENUM\s*\((.+)\)/i', $typePart, $enumMatch)) {
                $handleEnums = $options['handleEnums'] ?? $options['handle_enums'] ?? $options['enumHandling'] ?? 'varchar';
                if ($handleEnums === 'enum_table') {
                    $typePart = "TEXT /* ENUM converted to separate table */";
                } else {
                    $typePart = "TEXT";
                }
                $isHandled = true;
            } elseif (preg_match('/SET\s*\((.+)\)/i', $typePart, $setMatch)) {
                $handleSets = $options['handleSets'] ?? $options['handle_sets'] ?? $options['setHandling'] ?? 'varchar';
                if ($handleSets === 'array') {
                    $typePart = "TEXT[]";
                } elseif ($handleSets === 'separate_table') {
                    $typePart = "TEXT /* SET converted to separate table */";
                } else {
                    $typePart = "TEXT";
                }
                $isHandled = true;
            }

            if (!$isHandled) {
                foreach ($typeMap as $mysqlType => $pgType) {
                    if (preg_match('/\b' . preg_quote($mysqlType, '/') . '\b/i', $typePart)) {
                        if (($options['predictiveRefactoring'] ?? $options['predictive_refactoring'] ?? false)) {
                            if (stripos($mysqlType, 'varchar') !== false) {
                                $report[] = ['type' => 'info', 'message' => "Column '$columnName': Suggestion: Use TEXT instead of VARCHAR for unlimited length and better performance."];
                            }
                        }
                        $typePart = preg_replace('/\b' . preg_quote($mysqlType, '/') . '\b/i', $pgType, $typePart);
                        break;
                    }
                }
            }
        }

        $noPrecisionTypes = ['INTEGER', 'BIGINT', 'SMALLINT', 'DOUBLE PRECISION', 'REAL', 'BOOLEAN', 'TEXT', 'UUID', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'DATE', 'TIME', 'JSONB'];
        foreach ($noPrecisionTypes as $npType) {
            if (stripos($typePart, $npType) !== false)
                $typePart = preg_replace('/\b' . preg_quote($npType, '/') . '\s*\(\d+(?:,\d+)?\)/i', $npType, $typePart);
        }

        $converted = ($splitPos !== -1) ? trim($typePart) . ' ' . trim($attrPart) : trim($typePart);
        if (stripos($converted, 'AUTO_INCREMENT') !== false) {
            $serialType = stripos($converted, 'BIGINT') !== false ? 'BIGSERIAL' : (stripos($converted, 'SMALLINT') !== false ? 'SMALLSERIAL' : 'SERIAL');
            $converted = preg_replace('/^\s*(?:INTEGER|BIGINT|SMALLINT|INT)\b/i', $serialType, $converted);
            $converted = str_ireplace(['AUTO_INCREMENT', 'NOT NULL'], '', $converted);
        }

        $converted = trim(preg_replace('/\s+/', ' ', $converted));
        $converted = str_ireplace(['ON UPDATE CURRENT_TIMESTAMP', 'ON UPDATE CURRENT_TIMESTAMP()', 'ON UPDATE NOW()'], '', $converted);
        return trim($converted);
    }

    public function convertMysqlColumnToSQLite(array|string $column, array $options): string
    {
        $definition = is_array($column) ? $column['definition'] : $column;
        $isPk = stripos($definition, 'PRIMARY KEY') !== false;
        $isAi = stripos($definition, 'AUTO_INCREMENT') !== false;

        $definition = strtoupper($definition);
        $type = 'TEXT';
        if (preg_match('/\bINT\b|\bBIGINT\b|\bMEDIUMINT\b|\bSMALLINT\b|\bTINYINT\b|\bBIT\b|\bYEAR\b/i', $definition))
            $type = 'INTEGER';
        elseif (preg_match('/\bVARCHAR\b|\bCHAR\b|\bTEXT\b|\bLONGTEXT\b|\bMEDIUMTEXT\b|\bTINYTEXT\b|\bDATETIME\b|\bTIMESTAMP\b|\bJSON\b/i', $definition))
            $type = 'TEXT';
        elseif (preg_match('/\bDOUBLE\b|\bFLOAT\b|\bREAL\b/i', $definition))
            $type = 'REAL';
        elseif (preg_match('/\bDECIMAL\b|\bNUMERIC\b/i', $definition))
            $type = 'NUMERIC';
        elseif (preg_match('/\bBLOB\b|\bLONGBLOB\b|\bMEDIUMBLOB\b|\bTINYBLOB\b|\bVARBINARY\b|\bBINARY\b/i', $definition))
            $type = 'BLOB';

        if ($isPk && $isAi && $type === 'INTEGER') {
            return 'INTEGER PRIMARY KEY AUTOINCREMENT';
        }
        return $type;
    }

    public function convertOracleColumnToPostgreSQL(string $definition, array $options): string
    {
        $definition = strtoupper($definition);
        if (str_starts_with($definition, 'VARCHAR2'))
            return 'TEXT';
        if (preg_match('/NUMBER\s*\(\s*(\d+)\s*\)/i', $definition, $m))
            return ($m[1] > 9) ? 'BIGINT' : 'INTEGER';
        if (preg_match('/NUMBER\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i', $definition))
            return 'DECIMAL' . substr($definition, 6);
        if ($definition === 'DATE')
            return 'TIMESTAMP WITH TIME ZONE';
        if ($definition === 'CLOB')
            return 'TEXT';
        if ($definition === 'BLOB')
            return 'BYTEA';
        return 'TEXT';
    }

    public function convertSqlServerColumnToPostgreSQL(string $definition, array $options): string
    {
        $definition = strtoupper($definition);
        if ($definition === 'VARCHAR' || $definition === 'NVARCHAR' || $definition === 'TEXT' || $definition === 'NTEXT')
            return 'TEXT';
        if ($definition === 'INT')
            return 'INTEGER';
        if ($definition === 'BIGINT')
            return 'BIGINT';
        if ($definition === 'BIT')
            return 'BOOLEAN';
        if ($definition === 'DATETIME' || $definition === 'DATETIME2')
            return 'TIMESTAMP WITH TIME ZONE';
        if ($definition === 'UNIQUEIDENTIFIER')
            return 'UUID';
        return 'TEXT';
    }

    public function transpileQuery(string $query, array $options = [], array $schema = []): string
    {
        $targetFormat = $options['targetFormat'] ?? $options['target_format'] ?? 'postgresql';
        $query = preg_replace('/IFNULL\s*\(/i', 'COALESCE(', $query);
        $query = preg_replace('/ISNULL\s*\(\s*([^)]+)\s*\)/i', '($1 IS NULL)', $query);
        $query = preg_replace('/DATEDIFF\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/i', '(($1)::date - ($2)::date)', $query);

        $query = preg_replace('/DATE_SUB\s*\(\s*(?:NOW\s*\(\s*\)|CURRENT_TIMESTAMP)\s*,\s*INTERVAL\s+([\d]+)\s+([A-Z]+)\s*\)/i', "CURRENT_TIMESTAMP - INTERVAL '$1 $2'", $query);
        $query = preg_replace('/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+([\d]+)\s+([A-Z]+)\s*\)/i', "$1 - INTERVAL '$2 $3'", $query);

        $query = preg_replace('/DATE_ADD\s*\(\s*(?:NOW\s*\(\s*\)|CURRENT_TIMESTAMP)\s*,\s*INTERVAL\s+([\d]+)\s+([A-Z]+)\s*\)/i', "CAST(CURRENT_TIMESTAMP AS TIMESTAMP) + INTERVAL '$1 $2'", $query);
        $query = preg_replace('/DATE_ADD\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+([\d]+)\s+([A-Z]+)\s*\)/i', "CAST($1 AS TIMESTAMP) + INTERVAL '$2 $3'", $query);

        $query = preg_replace('/SUBSTRING_INDEX\s*\(/i', 'substring_index(', $query);
        $query = preg_replace('/GROUP_CONCAT\s*\(\s*([^ ]+)\s+SEPARATOR\s+([^)]+)\s*\)/i', 'STRING_AGG($1, $2)', $query);
        $query = preg_replace('/GROUP_CONCAT\s*\(\s*([^ )]+)\s*\)/i', "STRING_AGG($1, ',')", $query);
        $query = preg_replace('/UNIX_TIMESTAMP\s*\(\s*\)/i', 'EXTRACT(EPOCH FROM NOW())', $query);
        $query = preg_replace('/UTC_TIMESTAMP\s*\(\s*\)/i', "(NOW() AT TIME ZONE 'UTC')", $query);

        if ($targetFormat === 'postgresql') {
            $query = preg_replace('/LIMIT\s+([\d]+)\s*,\s*([\d]+)/i', 'LIMIT $2 OFFSET $1', $query);

            if (stripos($query, 'INSERT IGNORE') !== false) {
                $query = str_ireplace('INSERT IGNORE', 'INSERT', $query);
                $query = preg_replace('/;\s*$/', ' ON CONFLICT DO NOTHING;', $query);
            }
            if (stripos($query, 'REPLACE INTO') !== false) {
                $query = str_ireplace('REPLACE INTO', 'INSERT INTO', $query);
                if (($options['replaceHandling'] ?? '') === 'upsert' || ($options['replace_handling'] ?? '') === 'upsert') {
                    $query = preg_replace('/;\s*$/', ' ON CONFLICT DO UPDATE SET /* Add conflict resolution */;', $query);
                } else {
                    preg_match('/INSERT INTO\s+[`"]?(\w+)[`"]?/i', $query, $tm);
                    $tableName = $tm[1] ?? null;
                    $pk = 'id';
                    if ($tableName && isset($schema['tables'][$tableName]['primary_key']))
                        $pk = $schema['tables'][$tableName]['primary_key'];
                    if (preg_match('/INSERT INTO\s+[^\(]+\(([^\)]+)\)/i', $query, $cm)) {
                        $cols = array_map('trim', explode(',', $cm[1]));
                        $updateParts = [];
                        foreach ($cols as $c) {
                            $c = trim($c, '`" ');
                            if (strtolower($c) !== strtolower($pk))
                                $updateParts[] = "\"$c\" = EXCLUDED.\"$c\"";
                        }
                        $query = preg_replace('/;\s*$/', " ON CONFLICT (\"$pk\") DO UPDATE SET " . implode(", ", $updateParts) . ";", $query);
                    } else {
                        $query = preg_replace('/;\s*$/', " ON CONFLICT (\"$pk\") DO NOTHING;", $query);
                    }
                }
            }
        }
        $query = preg_replace('/`([^` ]+)`/', '"$1"', $query);
        return $query;
    }

    public function validateSQLForSandbox(string $sql): void
    {
        if (strlen($sql) > 10000000) {
            throw new \Exception("SQL payload exceeds the Enterprise safety threshold (10MB).");
        }

        // Enhanced splitting that respects dollar-quoting ($$)
        $statements = [];
        $current = '';
        $inDollar = false;
        $lines = explode("\n", $sql);
        foreach ($lines as $line) {
            $current .= $line . "\n";
            $matchCount = preg_match_all('/\$\w*\$/', $line, $matches);
            if ($matchCount % 2 !== 0) {
                $inDollar = !$inDollar;
            }
            if (!$inDollar && str_contains($line, ';')) {
                // This is a bit simplified but should work for most dumps
                $parts = explode(';', $current);
                $last = array_pop($parts);
                foreach ($parts as $p) {
                    $statements[] = trim($p);
                }
                $current = $last;
            }
        }
        if (!empty(trim($current))) {
            $statements[] = trim($current);
        }

        $allowedStatements = ['CREATE', 'INSERT', 'SELECT', 'SET', 'SHOW', 'USE', 'ALTER'];
        $forbiddenRegex = [
            '/\bDROP\s+DATABASE\b/i',
            '/\bGRANT\b/i',
            '/\bREVOKE\b/i',
            '/\bALTER\s+USER\b/i',
            '/\bCREATE\s+USER\b/i',
            '/\bLOAD\s+DATA\b/i',
            '/\bINTO\s+OUTFILE\b/i',
            '/\bSHUTDOWN\b/i',
            '/\bTRUNCATE\s+USER\b/i',
            '/\bREPLICATION\b/i',
            '/\bSUPER\b/i'
        ];

        foreach ($statements as $stmt) {
            if (empty($stmt)) continue;

            $cleanStmt = $this->stripSQLComments($stmt);
            foreach ($forbiddenRegex as $pattern) {
                if (preg_match($pattern, $cleanStmt)) {
                    throw new \Exception("SQL contains forbidden keyword or pattern matching " . $pattern);
                }
            }

            try {
                $parsed = $this->sqlParser->parse($stmt);
                if (!$parsed) continue;

                foreach ($parsed as $key => $value) {
                    if (is_string($key) && ctype_upper($key)) {
                        if (!in_array($key, $allowedStatements)) {
                            // Allow DROP TABLE / DROP FUNCTION / DROP TRIGGER if it's not DROP DATABASE
                            if ($key === 'DROP') {
                                if (preg_match('/\bDATABASE\b/i', $cleanStmt)) {
                                    throw new \Exception("Forbidden DROP DATABASE operation.");
                                }
                                continue;
                            }
                            throw new \Exception("Forbidden SQL operation in sandbox: " . $key);
                        }
                    }
                }
            } catch (\Exception $e) {
                // If it's not a DDL/DML we recognize, and it's not a comment, be suspicious
                if (!preg_match('/^\s*(--|#|\/\*)/', $stmt)) {
                    // Basic fallback for simple statements the parser might struggle with
                    if (!preg_match('/^\s*(CREATE|INSERT|SET|SELECT|DROP TABLE|SHOW|ALTER|DECLARE|BEGIN|IF|RETURN|ELSIF|END)\b/i', $cleanStmt)) {
                        throw new \Exception("Unverifiable SQL statement detected: " . substr($cleanStmt, 0, 50) . "...");
                    }
                }
            }
        }
    }

    protected function stripSQLComments(string $sql): string
    {
        // Remove multi-line comments
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
        // Remove single-line comments
        $lines = explode("\n", $sql);
        $cleanLines = [];
        foreach ($lines as $line) {
            $cleanLine = preg_replace('/(--|#).*$/i', '', $line);
            $cleanLines[] = $cleanLine;
        }
        return trim(implode("\n", $cleanLines));
    }

    public function performAutoCleaning(array &$schema, array $options, array &$report): void
    {
        if (!($options['autoCleaning'] ?? $options['auto_cleaning'] ?? false))
            return;

        $tableSignatures = [];
        foreach ($schema['tables'] as $tableName => &$table) {
            // Mixed Naming Detection
            $hasSnake = false;
            $hasCamel = false;
            foreach ($table['columns'] as $col) {
                if (str_contains($col['name'], '_'))
                    $hasSnake = true;
                if (preg_match('/[a-z][A-Z]/', $col['name']))
                    $hasCamel = true;
            }
            if ($hasSnake && $hasCamel) {
                $report[] = ['type' => 'warning', 'message' => "Table '$tableName' uses mixed naming (snake_case and camelCase). This can lead to inconsistency."];
            }

            // Duplicate Structure Detection
            $sig = collect($table['columns'])->map(fn($c) => $c['name'] . ':' . trim(strtoupper($c['definition'])))->sort()->join('|');
            foreach ($tableSignatures as $prevTable => $prevSig) {
                if ($sig === $prevSig) {
                    $report[] = ['type' => 'warning', 'message' => "Table '$tableName' has an identical structure to '$prevTable'. Consider normalization."];
                }
            }
            $tableSignatures[$tableName] = $sig;
        }
    }

    public function maskSensitiveData(string $line, array $options, array $schema): string
    {
        if (!($options['maskSensitiveData'] ?? $options['mask_sensitive_data'] ?? $options['dataMasking'] ?? false))
            return $line;

        // Fast global regex for emails/phones (standard patterns)
        // This provides basic protection even if we skip full parsing
        $line = preg_replace('/\'[^\'@\s]+@[^\'@\s]+\.[^\'@\s]+\'/', "'" . $this->faker->safeEmail() . "'", $line);
        $line = preg_replace('/\'\b(?:\d{1,4}-)?\d{3}-\d{4}\b\'/', "'" . $this->faker->phoneNumber() . "'", $line);
        
        if (stripos($line, 'INSERT INTO') === false)
            return $line;

        // Performance: Skip heavy AST parsing for very large lines (multi-row inserts)
        // In these cases, the global regex above provides the primary defense.
        if (strlen($line) > 100000) {
             return $line;
        }

        try {
            // Only parse if we have a reason to (e.g. name-based masking)
            $parsed = $this->sqlParser->parse((string) $line);
            if (!isset($parsed['INSERT'], $parsed['VALUES']))
                return $line;

            $tableName = '';
            $insertCols = [];
            foreach ($parsed['INSERT'] as $item) {
                if ($item['expr_type'] === 'table') {
                    $tableName = strtolower(trim($item['no_quotes']['parts'][0] ?? '', '`" '));
                }
                if ($item['expr_type'] === 'column-list') {
                    foreach ($item['sub_tree'] as $col) {
                        $insertCols[] = strtolower(trim($col['no_quotes']['parts'][0] ?? '', '`" '));
                    }
                }
            }
            
            if (empty($tableName)) return $line;
            $tableSchema = $schema[$tableName] ?? null;

            foreach ($parsed['VALUES'] as &$row) {
                foreach ($row['data'] as $idx => &$val) {
                    $colName = $insertCols[$idx] ?? ($tableSchema['columns'][$idx]['name'] ?? null);
                    if ($colName) {
                        $tag = $this->detectPiiTag($colName);
                        if ($tag) {
                            switch ($tag) {
                                case 'EMAIL':
                                    $val['base_expr'] = "'" . $this->faker->safeEmail() . "'";
                                    break;
                                case 'NAME':
                                    $val['base_expr'] = "'" . $this->faker->name() . "'";
                                    break;
                                case 'PHONE':
                                    $val['base_expr'] = "'" . $this->faker->phoneNumber() . "'";
                                    break;
                                case 'ADDRESS':
                                    $val['base_expr'] = "'" . str_replace(["\n", "\r"], " ", $this->faker->address()) . "'";
                                    break;
                                case 'DATE':
                                    $val['base_expr'] = "'" . $this->faker->date() . "'";
                                    break;
                                case 'IP':
                                    $val['base_expr'] = "'" . $this->faker->ipv4() . "'";
                                    break;
                                case 'SENSITIVE':
                                    $val['base_expr'] = "'" . $this->faker->sha256() . "'";
                                    break;
                                case 'PASSWORD':
                                    $val['base_expr'] = "'" . $this->faker->password() . "'";
                                    break;
                                default:
                                    $val['base_expr'] = "'" . $this->faker->word() . "'";
                            }
                        }
                    }
                }
            }
            return (new PHPSQLCreator($parsed))->create($parsed) . ";";
        } catch (\Exception $e) {
            // Fallback to the original line if parsing fails
        }

        return $line;
    }

    public function detectPiiTag(string $columnName): ?string
    {
        $name = strtolower(trim($columnName, '`" '));
        if (preg_match('/email|mail/i', $name))
            return 'EMAIL';
        if (preg_match('/phone|tel|mobile/i', $name))
            return 'PHONE';
        if (preg_match('/\bname\b|full_name|first_name|last_name|surname|username/i', $name))
            return 'NAME';
        if (preg_match('/address|street|city|zip|postal|state|country/i', $name))
            return 'ADDRESS';
        if (preg_match('/birth|dob/i', $name))
            return 'DATE';
        if (preg_match('/ssn/i', $name))
            return 'SSN';
        if (preg_match('/social_security|passport|credit_card|card_num/i', $name))
            return 'SENSITIVE';
        if (preg_match('/password/i', $name))
            return 'PASSWORD';
        if (preg_match('/ip_address|client_ip|remote_addr/i', $name))
            return 'IP';
        if (preg_match('/api_key|secret|token|auth_key|private_key|key\b/i', $name))
            return 'SENSITIVE';
        return null;
    }

    public function containsValidSqlStatements(string $sql): bool
    {
        return preg_match('/CREATE\s+TABLE|INSERT\s+INTO/i', $sql);
    }

    public function quotePostgreSQLIdentifier(string $identifier): string
    {
        $reserved = ['select', 'from', 'where', 'insert', 'update', 'delete', 'create', 'table'];
        if (in_array(strtolower($identifier), $reserved))
            return '"' . $identifier . '"';
        return $identifier;
    }

    public function applyFrameworkColumnOverrides(array $column, string $preset, string $tableName): array
    {
        $preset = strtolower($preset);
        if ($preset === 'laravel' && $column['name'] === 'id')
            $column['definition'] = 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';

        if ($preset === 'magento' && $column['name'] === 'value') {
            if (str_contains($tableName, '_decimal'))
                $column['definition'] = 'NUMERIC(12,4)';
            if (str_contains($tableName, '_int'))
                $column['definition'] = 'INTEGER';
        }
        return $column;
    }

    public function openSqlStream(string|UploadedFile $input)
    {
        if ($input instanceof UploadedFile)
            return fopen($input->getRealPath(), 'r');
        $fp = fopen('php://temp', 'r+');
        fwrite($fp, $input);
        rewind($fp);
        return $fp;
    }

    public function splitSqlValues(string $input, string $open = '', string $close = ''): array
    {
        $parts = [];
        $current = '';
        $depth = 0;
        $inQuote = false;
        $quoteChar = '';
        $len = strlen($input);
        for ($i = 0; $i < $len; $i++) {
            $char = $input[$i];
            if ($inQuote) {
                if ($char === $quoteChar && ($i === 0 || $input[$i - 1] !== '\\'))
                    $inQuote = false;
                $current .= $char;
            } else {
                if ($char === '\'' || $char === '"') {
                    $inQuote = true;
                    $quoteChar = $char;
                    $current .= $char;
                } elseif ($open && $char === $open) {
                    $depth++;
                    $current .= $char;
                } elseif ($close && $char === $close) {
                    $depth--;
                    $current .= $char;
                } elseif ($char === ',' && $depth === 0) {
                    $parts[] = trim($current);
                    $current = '';
                } else
                    $current .= $char;
            }
        }
        if (!empty(trim($current)))
            $parts[] = trim($current);
        return $parts;
    }
}
