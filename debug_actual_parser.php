<?php

require_once 'vendor/autoload.php';

// Simulate Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;

// Read the user's SQL file
$filePath = '/Users/chanminko/Downloads/no1_service_customer_uat_.sql';
$sqlContent = file_get_contents($filePath);

echo "=== DIRECT PARSER TEST ===\n";
echo "File size: " . strlen($sqlContent) . " bytes\n";

// Test the actual parser function directly
$controller = new ConversionController();
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('parseMysqlDump');
$method->setAccessible(true);

echo "\n=== CALLING ACTUAL PARSER ===\n";
try {
    $result = $method->invoke($controller, $sqlContent);
    echo "Parser executed successfully\n";
    echo "Tables found: " . count($result['tables']) . "\n";
    
    if (!empty($result['tables'])) {
        echo "Table names: " . implode(', ', array_keys($result['tables'])) . "\n";
        
        // Show details of first table
        $firstTable = array_values($result['tables'])[0];
        echo "\nFirst table details:\n";
        echo "Name: " . $firstTable['name'] . "\n";
        echo "Columns: " . count($firstTable['columns']) . "\n";
        if (!empty($firstTable['columns'])) {
            echo "First column: " . $firstTable['columns'][0]['name'] . " - " . $firstTable['columns'][0]['definition'] . "\n";
        }
    } else {
        echo "No tables found\n";
        
        // Let's debug by testing with a simple CREATE TABLE
        echo "\n=== TESTING WITH SIMPLE CREATE TABLE ===\n";
        $simpleSQL = "CREATE TABLE `test_table` (\n  `id` int(11) NOT NULL,\n  `name` varchar(255) DEFAULT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        echo "Test SQL:\n$simpleSQL\n\n";
        
        $simpleResult = $method->invoke($controller, $simpleSQL);
        echo "Simple test - Tables found: " . count($simpleResult['tables']) . "\n";
        if (!empty($simpleResult['tables'])) {
            echo "Simple test - Table names: " . implode(', ', array_keys($simpleResult['tables'])) . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error calling parser: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}