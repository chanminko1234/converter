<?php

// Simulate the exact parsing logic from ConversionController
class TestParser {
    public function parseMysqlDump(string $dump): array
    {
        $lines = explode("\n", $dump);
        $tables = [];
        $currentTable = null;
        $inCreateTable = false;
        $tableStructure = [];

        echo "=== PARSING SIMULATION ===\n";
        foreach ($lines as $lineNum => $line) {
            echo "Line $lineNum: [" . $line . "]\n";
            $line = trim($line);
            echo "  Trimmed: [" . $line . "]\n";

            // Handle single-line CREATE TABLE statements
            if (preg_match('/^CREATE TABLE `?([^`\s]+)`?\s*\((.+)\);?$/i', $line, $matches)) {
                echo "  -> Single-line CREATE TABLE match\n";
                // ... (not relevant for our multi-line case)
                continue;
            }
            
            // Handle multi-line CREATE TABLE statements
            if (preg_match('/^CREATE TABLE `?([^`\s]+)`?\s*\(/i', $line, $matches)) {
                echo "  -> Multi-line CREATE TABLE start: table=" . $matches[1] . "\n";
                $currentTable = $matches[1];
                $inCreateTable = true;
                $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
                
                // Check if the opening parenthesis and some column definitions are on the same line
                $remainingLine = preg_replace('/^CREATE TABLE `?[^`\s]+`?\s*\(/i', '', $line);
                echo "  -> Remaining line after CREATE TABLE: [" . $remainingLine . "]\n";
                if (trim($remainingLine) && !str_ends_with(trim($remainingLine), ');')) {
                    echo "  -> Processing remaining line as column\n";
                    // Process the remaining part of the line as a column definition
                    $columnDef = trim($remainingLine);
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $colMatches)) {
                        $columnName = strtoupper($colMatches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN'])) {
                            echo "  -> Adding column: name=[" . $colMatches[1] . "], def=[" . trim($colMatches[2], ' ,') . "]\n";
                            $tableStructure['columns'][] = [
                                'name' => $colMatches[1],
                                'definition' => trim($colMatches[2], ' ,'),
                            ];
                        }
                    }
                }
            } elseif ($inCreateTable && !empty(trim($line)) && $line !== ');') {
                echo "  -> Processing column line\n";
                // Parse column definitions in multi-line format
                $columnDef = trim($line);
                echo "  -> Column def: [" . $columnDef . "]\n";
                // Skip lines that contain CREATE TABLE or just opening parenthesis
                if (!preg_match('/^CREATE\s+TABLE/i', $columnDef) && !preg_match('/^\s*\(\s*$/', $columnDef)) {
                    echo "  -> Not a CREATE TABLE line, testing regex\n";
                    if (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $columnDef, $matches)) {
                        echo "  -> Regex matched: name=[" . $matches[1] . "], def=[" . $matches[2] . "]\n";
                        $columnName = strtoupper($matches[1]);
                        if (! in_array($columnName, ['PRIMARY', 'KEY', 'INDEX', 'UNIQUE', 'CONSTRAINT', 'FOREIGN', 'CREATE'])) {
                            echo "  -> Adding column: name=[" . $matches[1] . "], def=[" . trim($matches[2], ' ,') . "]\n";
                            $tableStructure['columns'][] = [
                                'name' => $matches[1],
                                'definition' => trim($matches[2], ' ,'),
                            ];
                        } else {
                            echo "  -> Skipping reserved word: " . $columnName . "\n";
                        }
                    } else {
                        echo "  -> Regex did not match\n";
                    }
                } else {
                    echo "  -> Skipping CREATE TABLE or parenthesis line\n";
                }
            } elseif ($inCreateTable && $line === ');') {
                echo "  -> End of CREATE TABLE\n";
                $inCreateTable = false;
                if ($currentTable) {
                    $tables[$currentTable] = $tableStructure;
                }
            } else {
                echo "  -> No action for this line\n";
            }
            echo "\n";
        }

        return ['tables' => $tables, 'raw_dump' => $dump];
    }
}

$input = "CREATE TABLE products (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  price DECIMAL(10,2),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);";

$parser = new TestParser();
$result = $parser->parseMysqlDump($input);

echo "\n=== FINAL RESULT ===\n";
if (isset($result['tables']['products'])) {
    foreach ($result['tables']['products']['columns'] as $col) {
        echo "Column: name=[" . $col['name'] . "] definition=[" . $col['definition'] . "]\n";
    }
} else {
    echo "No products table found\n";
}