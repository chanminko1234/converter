<?php

require_once 'vendor/autoload.php';

// Read the user's SQL file
$filePath = '/Users/chanminko/Downloads/no1_service_customer_uat_.sql';
$sqlContent = file_get_contents($filePath);

echo "=== STEP BY STEP PARSER DEBUG ===\n";
echo "File size: " . strlen($sqlContent) . " bytes\n";
echo "First 500 characters:\n" . substr($sqlContent, 0, 500) . "\n\n";

// Simulate the exact parsing logic from ConversionController
$lines = explode("\n", $sqlContent);
$tables = [];
$currentTable = null;
$tableStructure = null;
$inCreateTable = false;

echo "=== PARSING SIMULATION ===\n";
$lineCount = 0;
$tablesFound = 0;

foreach ($lines as $lineNum => $line) {
    $lineCount++;
    $line = trim($line);
    
    // Skip empty lines and MySQL-specific comments/directives
    if (empty($line) || 
        preg_match('/^\s*\/\*!.*?\*\/$/', $line) ||
        preg_match('/^\s*SET\s+/', $line) ||
        preg_match('/^\s*DROP\s+TABLE\s+IF\s+EXISTS\s+/', $line) ||
        preg_match('/^\s*(LOCK|UNLOCK)\s+TABLES/', $line) ||
        preg_match('/^\s*\/\*!\d+\s+(DIS|EN)ABLE\s+KEYS\s+\*\//', $line) ||
        preg_match('/^\s*--/', $line)) {
        continue;
    }
    
    // Debug output for CREATE TABLE lines
    if (preg_match('/CREATE\s+TABLE/i', $line)) {
        echo "Line $lineNum: Found CREATE TABLE: $line\n";
        
        // Test single-line CREATE TABLE with full definition
        if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\((.+)\)\s*(ENGINE|DEFAULT|AUTO_INCREMENT|COMMENT|CHARSET|COLLATE|ROW_FORMAT|KEY_BLOCK_SIZE|MAX_ROWS|MIN_ROWS|PACK_KEYS|DELAY_KEY_WRITE|CHECKSUM|PARTITION|;)/i', $line, $matches)) {
            echo "  -> Matched single-line CREATE TABLE with full definition\n";
            $tableName = $matches[1];
            $columnsStr = $matches[2];
            echo "  -> Table: $tableName\n";
            echo "  -> Columns string: " . substr($columnsStr, 0, 100) . "...\n";
            
            $tableStructure = ['name' => $tableName, 'columns' => [], 'indexes' => []];
            $tables[$tableName] = $tableStructure;
            $tablesFound++;
            echo "  -> Added to tables array (total: $tablesFound)\n";
            continue;
        }
        
        // Test single-line CREATE TABLE with opening parenthesis
        if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\(/i', $line, $matches)) {
            echo "  -> Matched CREATE TABLE with opening parenthesis\n";
            $currentTable = $matches[1];
            $inCreateTable = true;
            $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
            echo "  -> Started parsing table: $currentTable\n";
            echo "  -> inCreateTable = true\n";
        } elseif (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s]+)`?/i', $line, $matches)) {
            echo "  -> Matched CREATE TABLE without opening parenthesis\n";
            $currentTable = $matches[1];
            $inCreateTable = true;
            $tableStructure = ['name' => $currentTable, 'columns' => [], 'indexes' => []];
            echo "  -> Started parsing table: $currentTable\n";
            echo "  -> inCreateTable = true\n";
        }
    }
    
    // Check for table end
    if ($inCreateTable && (preg_match('/^\s*\)\s*(ENGINE|DEFAULT|AUTO_INCREMENT|COMMENT|CHARSET|COLLATE|ROW_FORMAT|KEY_BLOCK_SIZE|MAX_ROWS|MIN_ROWS|PACK_KEYS|DELAY_KEY_WRITE|CHECKSUM|PARTITION|;)/i', $line) || $line === ');')) {
        echo "Line $lineNum: Found table end: $line\n";
        echo "  -> Current table: $currentTable\n";
        echo "  -> Table structure exists: " . (isset($tableStructure) ? 'yes' : 'no') . "\n";
        
        $inCreateTable = false;
        if ($currentTable && isset($tableStructure)) {
            $tables[$currentTable] = $tableStructure;
            $tablesFound++;
            echo "  -> Added table '$currentTable' to tables array (total: $tablesFound)\n";
            $currentTable = null;
            $tableStructure = null;
        } else {
            echo "  -> ERROR: Could not add table (currentTable: $currentTable, tableStructure exists: " . (isset($tableStructure) ? 'yes' : 'no') . ")\n";
        }
    }
    
    // Stop after processing first 500 lines to avoid too much output
    if ($lineCount > 500) {
        echo "\n=== STOPPING AFTER 500 LINES ===\n";
        break;
    }
}

echo "\n=== FINAL RESULTS ===\n";
echo "Lines processed: $lineCount\n";
echo "Tables found during parsing: $tablesFound\n";
echo "Tables in final array: " . count($tables) . "\n";
echo "Table names: " . implode(', ', array_keys($tables)) . "\n";

// Test the actual parser function
echo "\n=== ACTUAL PARSER FUNCTION TEST ===\n";
$controller = new \App\Http\Controllers\ConversionController();
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('parseMysqlDump');
$method->setAccessible(true);

$result = $method->invoke($controller, $sqlContent);
echo "Actual parser result - Tables: " . count($result['tables']) . "\n";
if (!empty($result['tables'])) {
    echo "Table names from actual parser: " . implode(', ', array_keys($result['tables'])) . "\n";
}