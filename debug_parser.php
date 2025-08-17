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
    // Read the test SQL file
    $sqlContent = file_get_contents('test_upload_debug.sql');
    
    echo "=== INPUT SQL CONTENT ===\n";
    echo $sqlContent . "\n\n";
    
    // Create controller instance
    $controller = new ConversionController();
    
    // Use reflection to access the private parseMysqlDump method
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('parseMysqlDump');
    $method->setAccessible(true);
    
    // Call the parser directly
    $parseResult = $method->invoke($controller, $sqlContent);
    
    echo "=== PARSER RESULTS ===\n";
    echo "Tables found: " . count($parseResult['tables']) . "\n";
    
    if (!empty($parseResult['tables'])) {
        foreach ($parseResult['tables'] as $tableName => $tableData) {
            echo "\n--- Table: $tableName ---\n";
            echo "Columns: " . count($tableData['columns']) . "\n";
            foreach ($tableData['columns'] as $column) {
                echo "  - {$column['name']}: {$column['definition']}\n";
            }
        }
    } else {
        echo "No tables found by parser\n";
        
        // Let's debug line by line
        echo "\n=== LINE BY LINE DEBUG ===\n";
        $lines = explode("\n", $sqlContent);
        foreach ($lines as $i => $line) {
            $lineNum = $i + 1;
            $trimmedLine = trim($line);
            echo "Line $lineNum: '$trimmedLine'\n";
            
            if (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s\(]+)`?\s*\(/i', $line, $matches)) {
                echo "  -> Matches CREATE TABLE pattern: {$matches[1]}\n";
            } elseif (preg_match('/^\s*CREATE\s+TABLE\s+`?([^`\s]+)`?/i', $line, $matches)) {
                echo "  -> Matches CREATE TABLE without parenthesis: {$matches[1]}\n";
            } elseif (preg_match('/^`?([^`\s]+)`?\s+(.+)$/i', $trimmedLine, $matches)) {
                echo "  -> Matches column definition: {$matches[1]} -> {$matches[2]}\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}