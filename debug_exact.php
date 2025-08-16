<?php

// Exact replica of ConversionController's parseMysqlDump method
class ExactControllerDebug {
    public function parseMysqlDump(string $dump): array
    {
        echo "=== EXACT CONTROLLER DEBUG ===\n";
        echo "Input dump length: " . strlen($dump) . "\n";
        echo "Input dump: [" . $dump . "]\n";
        
        // Basic MySQL dump parser - this would be expanded with comprehensive parsing logic
        $lines = explode("\n", $dump);
        echo "Number of lines: " . count($lines) . "\n";
        
        $tables = [];
        $currentTable = null;
        $inCreateTable = false;
        $tableStructure = [];

        foreach ($lines as $lineIndex => $line) {
            echo "\n--- Processing line $lineIndex ---\n";
            echo "Raw line: [" . $line . "]\n";
            echo "Line length: " . strlen($line) . "\n";
            
            $line = trim($line);
            echo "Trimmed line: [" . $line . "]\n";
            echo "Trimmed length: " . strlen($line) . "\n";

            // Handle single-line CREATE TABLE statements
            if (preg_match('/^CREATE TABLE `?([^`\s]+)`?\s*\((.+)\);?$/i', $line, $matches)) {
                echo "MATCH: Single-line CREATE TABLE\n";
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
            
            // Handle multi-line CREATE TABLE statements
            if (preg_match('/^CREATE TABLE `?([^`\s]+)`?\s*\(/i', $line, $matches)) {
                echo "MATCH: Multi-line CREATE TABLE start\n";
                $currentTable = $matches[1];
                echo "Current table set to: [" . $currentTable . "]\n";
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
                
                // Check if the opening parenthesis and some column definitions are on the same line
                $remainingLine = preg_replace('/^CREATE TABLE `?[^`\s]+`?\s*\(/i', '', $line);
                echo "Remaining line after CREATE TABLE: [" . $remainingLine . "]\n";
                if (!empty(trim($remainingLine)) && $remainingLine !== ');') {
                    echo "Processing remaining line as column definition\n";
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        echo "Column match found: name=[" . $colMatches[1] . "], def=[" . $colMatches[2] . "]\n";
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                            ];
                            echo "Added column: " . $colMatches[1] . "\n";
                        }
                    }
                }
                continue;
            }
            
            // Handle multi-line CREATE TABLE without opening parenthesis on same line
            if (preg_match('/^CREATE TABLE `?([^`\s]+)`?\s*$/i', $line, $matches)) {
                echo "MATCH: Multi-line CREATE TABLE without parenthesis\n";
                $currentTable = $matches[1];
                echo "Current table set to: [" . $currentTable . "]\n";
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
                
                // Check for remaining content after table name
                $remainingLine = preg_replace('/^\s*CREATE\s+TABLE\s+`?[^`\s]+`?\s*/i', '', $line);
                echo "Remaining line after table name: [" . $remainingLine . "]\n";
                if (!empty(trim($remainingLine)) && $remainingLine !== '(' && $remainingLine !== ');') {
                    echo "Processing remaining content as column definition\n";
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        echo "Column match found: name=[" . $colMatches[1] . "], def=[" . $colMatches[2] . "]\n";
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                            ];
                            echo "Added column: " . $colMatches[1] . "\n";
                        }
                    }
                }
                continue;
            }
            
            if ($inCreateTable && !empty(trim($line)) && $line !== ');') {
                echo "Processing line in CREATE TABLE context\n";
                $columnDef = trim($line);
                echo "Column definition to process: [" . $columnDef . "]\n";
                
                // Skip lines that contain CREATE TABLE or just opening parenthesis
                if (!preg_match('/^CREATE\s+TABLE/i', $columnDef) && !preg_match('/^\s*\(\s*$/', $columnDef)) {
                    echo "Line passed skip checks\n";
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $matches)) {
                        echo "REGEX MATCH SUCCESS!\n";
                        echo "Match 1 (column name): [" . $matches[1] . "]\n";
                        echo "Match 2 (definition): [" . $matches[2] . "]\n";
                        
                        $columnName = strtoupper($matches[1]);
                        echo "Uppercase column name: [" . $columnName . "]\n";
                        
                        $excludedNames = ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'];
                        echo "Checking if column name is in excluded list: " . json_encode($excludedNames) . "\n";
                        
                        if (! in_array($columnName, $excludedNames)) {
                            echo "Column name NOT in excluded list - ADDING TO STRUCTURE\n";
                            $columnToAdd = [
                                'name' => $matches[1],
                                'definition' => trim($matches[2], ' ,'),
                            ];
                            echo "Column to add: " . json_encode($columnToAdd) . "\n";
                            
                            $tableStructure['columns'][] = $columnToAdd;
                            echo "Column added successfully. Total columns now: " . count($tableStructure['columns']) . "\n";
                        } else {
                            echo "Column name IS in excluded list - SKIPPING\n";
                        }
                    } else {
                        echo "REGEX MATCH FAILED for line: [" . $columnDef . "]\n";
                    }
                } else {
                    echo "Line skipped due to CREATE TABLE or parenthesis check\n";
                }
            } elseif ($inCreateTable && $line === ');') {
                echo "End of CREATE TABLE found\n";
                $inCreateTable = false;
                if ($currentTable) {
                    echo "Adding table to results: " . $currentTable . "\n";
                    echo "Table structure: " . json_encode($tableStructure) . "\n";
                    $tables[$currentTable] = $tableStructure;
                }
            } else {
                echo "Line ignored (not in CREATE TABLE context or empty)\n";
            }
        }

        echo "\n=== FINAL RESULTS ===\n";
        echo "Tables found: " . count($tables) . "\n";
        foreach ($tables as $tableName => $table) {
            echo "Table: $tableName\n";
            echo "  Columns: " . count($table['columns']) . "\n";
            foreach ($table['columns'] as $col) {
                echo "    - Name: [" . $col['name'] . "] (" . strlen($col['name']) . " chars)\n";
                echo "      Definition: [" . $col['definition'] . "]\n";
                echo "      Name char codes: ";
                for ($i = 0; $i < strlen($col['name']); $i++) {
                    echo ord($col['name'][$i]) . " ";
                }
                echo "\n";
            }
        }

        return ['tables' => $tables, 'raw_dump' => $dump];
    }
    
    private function parseColumnDefinitions(string $columnsStr): array
    {
        // Simple column parsing - split by comma but respect parentheses
        $columns = [];
        $current = '';
        $parenDepth = 0;
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
                $parenDepth++;
            } elseif (!$inQuotes && $char === ')') {
                $parenDepth--;
            } elseif (!$inQuotes && $char === ',' && $parenDepth === 0) {
                $columns[] = trim($current);
                $current = '';
                continue;
            }
            
            $current .= $char;
        }
        
        if (!empty(trim($current))) {
            $columns[] = trim($current);
        }
        
        return $columns;
    }
}

// Test with the same input as our previous tests
$testSql = "CREATE TABLE products (\n" .
           "  id INT AUTO_INCREMENT PRIMARY KEY,\n" .
           "  name VARCHAR(255) NOT NULL,\n" .
           "  price DECIMAL(10,2),\n" .
           "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n" .
           ");";

echo "Testing with SQL:\n$testSql\n\n";

$parser = new ExactControllerDebug();
$result = $parser->parseMysqlDump($testSql);

echo "\n=== SUMMARY ===\n";
echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";