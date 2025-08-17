<?php

require_once 'vendor/autoload.php';

// Simulate Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\ConversionController;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\File\UploadedFile as SymfonyUploadedFile;

try {
    $userFilePath = '/Users/chanminko/Downloads/no1_service_customer_uat_.sql';
    
    if (!file_exists($userFilePath)) {
        throw new Exception("User file not found: $userFilePath");
    }
    
    echo "=== USER FILE INFO ===\n";
    echo "File: $userFilePath\n";
    echo "Size: " . filesize($userFilePath) . " bytes\n";
    
    // Read first 1000 characters to see the structure
    $content = file_get_contents($userFilePath);
    echo "\n=== FIRST 1000 CHARACTERS ===\n";
    echo substr($content, 0, 1000) . "...\n";
    
    // Create a temporary copy for upload simulation
    $tempFile = tempnam(sys_get_temp_dir(), 'sql_upload_');
    copy($userFilePath, $tempFile);
    
    // Create UploadedFile instance
    $uploadedFile = new UploadedFile(
        $tempFile,
        'no1_service_customer_uat_.sql',
        'text/plain',
        null,
        true // test mode
    );
    
    // Create request
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
    
    echo "\n=== USER FILE UPLOAD TEST RESULTS ===\n";
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
    
    if ($responseData['success']) {
        $data = $responseData['data'];
        $metadata = $responseData['metadata'];
        
        echo "\n=== METADATA ===\n";
        echo "Tables processed: " . $metadata['tables_processed'] . "\n";
        echo "Target format: " . $metadata['target_format'] . "\n";
        echo "Processing time: " . $metadata['processing_time'] . " seconds\n";
        
        if (isset($data['sql']) && strlen($data['sql']) > 0) {
            echo "\n=== SQL OUTPUT ===\n";
            echo "SQL Output Length: " . strlen($data['sql']) . " characters\n";
            echo "\n=== FIRST 500 CHARACTERS OF SQL ===\n";
            echo substr($data['sql'], 0, 500) . "...\n";
        } else {
            echo "\n=== NO SQL OUTPUT OR EMPTY ===\n";
        }
        
        if (isset($data['report']) && !empty($data['report'])) {
            echo "\n=== CONVERSION REPORT ===\n";
            foreach ($data['report'] as $item) {
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
    
    // Clean up
    unlink($tempFile);
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}