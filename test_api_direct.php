<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

// Create a mock request with the exact data you provided
$requestData = [
    'mysql_dump' => "CREATE TABLE products (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  price DECIMAL(10,2),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);",
    'target_format' => 'postgresql',
    'options' => [
        'preserveIdentity' => true,
        'handleEnums' => 'check_constraint',
        'handleSets' => 'array',
        'timezoneHandling' => 'utc'
    ]
];

echo "=== TESTING API CONVERSION ===\n";
echo "Input data: " . json_encode($requestData, JSON_PRETTY_PRINT) . "\n\n";

try {
    $controller = new ConversionController();
    
    // Create a mock request
    $request = new Request();
    $request->merge($requestData);
    
    echo "Calling convert method...\n";
    $response = $controller->convert($request);
    
    echo "Response status: " . $response->getStatusCode() . "\n";
    echo "Response content: " . $response->getContent() . "\n";
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}