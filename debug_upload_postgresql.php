<?php

require_once 'vendor/autoload.php';

// Simulate Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

try {
    // Read the test SQL file
    $sqlContent = file_get_contents('test_upload_debug.sql');
    
    // Create a temporary file to simulate upload
    $tempFile = tempnam(sys_get_temp_dir(), 'sql_upload_test');
    file_put_contents($tempFile, $sqlContent);
    
    // Create UploadedFile instance
    $uploadedFile = new UploadedFile(
        $tempFile,
        'test_upload_debug.sql',
        'text/plain',
        null,
        true // test mode
    );
    
    // Create request with file and parameters
    $request = new Request();
    $request->files->set('file', $uploadedFile);
    $request->merge([
        'target_format' => 'postgresql',
        'options' => json_encode([
            'preserveIdentity' => true,
            'handleEnums' => 'check_constraint',
            'handleSets' => 'array',
            'timezoneHandling' => 'utc',
            'triggerHandling' => 'convert',
            'replaceHandling' => 'upsert',
            'ignoreHandling' => 'on_conflict_ignore'
        ])
    ]);
    
    // Create controller and call upload method
    $controller = new ConversionController();
    $response = $controller->upload($request);
    
    // Get response data
    $responseData = $response->getData(true);
    
    echo "=== UPLOAD TEST RESULTS ===\n";
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
    
    if ($responseData['success']) {
        echo "\n=== CONVERSION DATA ===\n";
        $data = $responseData['data'];
        
        echo "\n=== FULL RESPONSE DATA ===\n";
        echo json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
        
        if (isset($data['sql'])) {
            echo "\n=== SQL OUTPUT ===\n";
            echo "SQL Output Length: " . strlen($data['sql']) . " characters\n";
            if (strlen($data['sql']) > 0) {
                echo "\n=== FIRST 500 CHARACTERS OF SQL ===\n";
                echo substr($data['sql'], 0, 500) . "...\n";
            } else {
                echo "SQL output is empty\n";
            }
        } else {
            echo "\n=== NO SQL OUTPUT FOUND ===\n";
            echo "Available data keys: " . implode(', ', array_keys($data)) . "\n";
        }
        
        if (isset($responseData['report'])) {
            echo "\n=== CONVERSION REPORT ===\n";
            foreach ($responseData['report'] as $item) {
                echo "[{$item['type']}] {$item['message']}\n";
            }
        }
        
        if (isset($responseData['diff'])) {
            echo "\n=== DIFF OUTPUT ===\n";
            echo "Diff Length: " . strlen($responseData['diff']) . " characters\n";
        }
    } else {
        echo "\n=== ERROR ===\n";
        echo "Error: " . ($responseData['error'] ?? 'Unknown error') . "\n";
        
        if (isset($responseData['message'])) {
            echo "Message: " . $responseData['message'] . "\n";
        }
    }
    
    // Clean up
    unlink($tempFile);
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}