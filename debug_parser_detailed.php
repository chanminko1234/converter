<?php

require_once 'vendor/autoload.php';

// Simulate Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;
use Illuminate\Http\Request;
use ReflectionClass;
use ReflectionMethod;

try {
    $userFilePath = '/Users/chanminko/Downloads/no1_service_customer_uat_.sql';
    
    if (!file_exists($userFilePath)) {
        throw new Exception("User file not found: $userFilePath");
    }
    
    // Read the file content
    $content = file_get_contents($userFilePath);
    $lines = explode("\n", $content);
    
    echo "=== PARSING SIMULATION ===\n";
    echo "Total lines: " . count($lines) . "\n\n";
    
    $processedLines = 0;
    $skippedLines = 0;
    $createTableLines = [];
    
    foreach ($lines as $i => $line) {
        $line = trim($line);
        $lineNum = $i + 1;
        
        // Apply the same filtering logic as the parser
        if (empty($line) || 
            str_starts_with($line, '--') || 
            preg_match('/^\/\*!\d+.*\*\/$/', $line) || 
            preg_match('/^(SET|DROP TABLE IF EXISTS|LOCK TABLES|UNLOCK TABLES|DISABLE KEYS|ENABLE KEYS)/i', $line)) {
            $skippedLines++;
            continue;
        }
        
        $processedLines++;
        
        // Check for CREATE TABLE patterns
        if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\(/i', $line, $matches)) {
            $createTableLines[] = [
                'line_num' => $lineNum,
                'table_name' => $matches[1],
                'content' => $line
            ];
            echo "Found CREATE TABLE at line $lineNum: {$matches[1]}\n";
        } elseif (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s]+)`?/i', $line, $matches)) {
            $createTableLines[] = [
                'line_num' => $lineNum,
                'table_name' => $matches[1],
                'content' => $line
            ];
            echo "Found CREATE TABLE (no parenthesis) at line $lineNum: {$matches[1]}\n";
        }
        
        // Show first 10 processed lines for debugging
        if ($processedLines <= 10) {
            echo "Line $lineNum (processed): '$line'\n";
        }
    }
    
    echo "\n=== SUMMARY ===\n";
    echo "Total lines: " . count($lines) . "\n";
    echo "Processed lines: $processedLines\n";
    echo "Skipped lines: $skippedLines\n";
    echo "CREATE TABLE statements found: " . count($createTableLines) . "\n";
    
    if (!empty($createTableLines)) {
        echo "\n=== CREATE TABLE STATEMENTS ===\n";
        foreach ($createTableLines as $createTable) {
            echo "Line {$createTable['line_num']}: {$createTable['table_name']}\n";
            echo "  Content: {$createTable['content']}\n";
        }
    }
    
    // Now test the actual parser
    echo "\n=== ACTUAL PARSER TEST ===\n";
    $controller = new ConversionController();
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('parseMysqlDump');
    $method->setAccessible(true);
    
    $parseResult = $method->invoke($controller, $content);
    echo "Tables found by parser: " . count($parseResult['tables']) . "\n";
    
    if (!empty($parseResult['tables'])) {
        foreach ($parseResult['tables'] as $tableName => $tableData) {
            echo "  - $tableName: " . count($tableData['columns']) . " columns\n";
        }
    }
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}