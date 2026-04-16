<?php

namespace App\Http\Controllers;

use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\SQL\QueryStreamerService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SseController extends Controller
{
    protected SourceAdapterFactory $adapterFactory;
    protected QueryStreamerService $streamer;

    public function __construct(SourceAdapterFactory $adapterFactory, QueryStreamerService $streamer)
    {
        $this->adapterFactory = $adapterFactory;
        $this->streamer = $streamer;
    }

    /**
     * Stream SQL results via Server-Sent Events (SSE)
     */
    public function streamResults(Request $request): StreamedResponse
    {
        $sql = $request->input('sql', '');
        $sourceType = $request->input('source_type', 'mysql');
        $config = $request->input('source', []);

        // 1. Security: Enforce Read-Only SELECT statements
        if (!preg_match('/^\s*SELECT\b/i', $sql)) {
            abort(403, 'Security Violation: Only SELECT statements are permitted via the streaming protocol.');
        }

        // 2. Prevent Common SQL Injection keywords (Secondary Layer)
        $dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'COMMIT', 'ROLLBACK'];
        foreach ($dangerous as $keyword) {
            if (stripos($sql, $keyword) !== false) {
                abort(403, "Security Violation: Restricted keyword '{$keyword}' detected.");
            }
        }

        $response = new StreamedResponse(function () use ($sql, $sourceType, $config) {
            // Increase time limit for massive datasets
            set_time_limit(0);
            
            // 1. Initialize Adapter
            $adapter = $this->adapterFactory->create($sourceType);
            
            try {
                $adapter->setupConnection($config);
            } catch (\Exception $e) {
                echo "event: error\n";
                echo 'data: ' . json_encode(['message' => 'Connection failed: ' . $e->getMessage()]) . "\n\n";
                return;
            }

            // 2. Start Streaming
            $generator = $this->streamer->stream($adapter, $sql);

            foreach ($generator as $message) {
                if (connection_aborted()) break;

                echo "event: {$message['event']}\n";
                echo "data: " . json_encode($message['data']) . "\n\n";
                
                // Ensure the buffer is flushed for immediate delivery
                while (ob_get_level() > 0) ob_end_flush();
                flush();
            }
        });

        // Set SSE Headers
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no'); // Disable buffering for Nginx

        return $response;
    }
}
