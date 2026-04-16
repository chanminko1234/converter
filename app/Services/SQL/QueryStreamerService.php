<?php

namespace App\Services\SQL;

use App\Services\DatabaseAdapters\SourceAdapterInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QueryStreamerService
{
    /**
     * Stream query results using a Generator and SSE format
     */
    public function stream(SourceAdapterInterface $adapter, string $sql, array $params = []): \Generator
    {
        $connectionName = $adapter->getConnectionName();
        
        try {
            // Using PDO cursor for high-memory efficiency with large results
            $cursor = DB::connection($connectionName)->cursor($sql, $params);
            
            yield [
                'event' => 'meta',
                'data' => [
                    'status' => 'connected',
                    'timestamp' => now()->toIso8601String(),
                ]
            ];

            $count = 0;
            foreach ($cursor as $row) {
                yield [
                    'event' => 'row',
                    'data' => $row
                ];
                $count++;
            }

            yield [
                'event' => 'done',
                'data' => [
                    'total_rows' => $count,
                    'timestamp' => now()->toIso8601String(),
                ]
            ];

        } catch (\Throwable $e) {
            Log::error("Streaming Error: " . $e->getMessage());
            yield [
                'event' => 'error',
                'data' => [
                    'message' => 'Query execution failed: ' . $e->getMessage(),
                ]
            ];
        }
    }
}
