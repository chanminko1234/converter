<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;

$controller = new ConversionController();

$testSql = "CREATE TABLE products (\n" .
           "  id INT AUTO_INCREMENT PRIMARY KEY,\n" .
           "  name VARCHAR(255) NOT NULL,\n" .
           "  price DECIMAL(10,2),\n" .
           "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n" .
           ");";

echo "Testing ConversionController with SQL:\n$testSql\n\n";

// Use reflection to access the private method
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('parseMysqlDump');
$method->setAccessible(true);

$result = $method->invoke($controller, $testSql);

echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";

echo "\n=== DETAILED COLUMN ANALYSIS ===\n";
if (isset($result['tables']['products']['columns'])) {
    foreach ($result['tables']['products']['columns'] as $index => $column) {
        echo "Column $index:\n";
        echo "  Name: [" . $column['name'] . "] (length: " . strlen($column['name']) . ")\n";
        echo "  Definition: [" . $column['definition'] . "]\n";
        echo "  Name char codes: ";
        for ($i = 0; $i < strlen($column['name']); $i++) {
            echo ord($column['name'][$i]) . " ";
        }
        echo "\n";
        if ($column['name'] === "\n") {
            echo "  *** FOUND NEWLINE CHARACTER AS COLUMN NAME! ***\n";
        }
        echo "\n";
    }
} else {
    echo "No columns found in products table\n";
}