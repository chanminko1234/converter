<?php

require_once 'vendor/autoload.php';

// Simulate Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;
use Illuminate\Http\Request;

try {
    // Read the test SQL file
    $sqlContent = file_get_contents('test_upload_debug.sql');
    
    echo "=== INPUT SQL CONTENT ===\n";
    echo "Length: " . strlen($sqlContent) . " characters\n";
    echo "First 200 characters: " . substr($sqlContent, 0, 200) . "...\n\n";
    
    // Create request with the SQL content directly
    $request = new Request([
        'mysql_dump' => $sqlContent,
        'target_format' => 'postgresql',
        'options' => [
            'preserveIdentity' => true,
            'handleEnums' => 'check_constraint',
            'handleSets' => 'array',
            'timezoneHandling' => 'utc',
            'triggerHandling' => 'convert',
            'replaceHandling' => 'upsert',
            'ignoreHandling' => 'on_conflict_ignore'
        ]
    ]);
    
    // Create controller and call convert method
    $controller = new ConversionController();
    $response = $controller->convert($request);
    
    // Get response data
    $responseData = $response->getData(true);
    
    echo "=== DIRECT CONVERT TEST RESULTS ===\n";
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
    
    if ($responseData['success']) {
        echo "\n=== FULL RESPONSE DATA ===\n";
        echo json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
        
        $data = $responseData['data'];
        
        if (isset($data['sql']) && strlen($data['sql']) > 0) {
            echo "\n=== SQL OUTPUT ===\n";
            echo "SQL Output Length: " . strlen($data['sql']) . " characters\n";
            echo "\n=== FIRST 500 CHARACTERS OF SQL ===\n";
            echo substr($data['sql'], 0, 500) . "...\n";
        } else {
            echo "\n=== NO SQL OUTPUT OR EMPTY ===\n";
        }
        
        if (isset($responseData['report']) && !empty($responseData['report'])) {
            echo "\n=== CONVERSION REPORT ===\n";
            foreach ($responseData['report'] as $item) {
                echo "[{$item['type']}] {$item['message']}\n";
            }
        }
    } else {
        echo "\n=== ERROR ===\n";
        echo "Error: " . ($responseData['error'] ?? 'Unknown error') . "\n";
        
        if (isset($responseData['message'])) {
            echo "Message: " . $responseData['message'] . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}