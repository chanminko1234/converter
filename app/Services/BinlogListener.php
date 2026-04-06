<?php

namespace App\Services;

use App\Models\CdcChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BinlogListener
{
    /**
     * Simulation of a Debezium-like binlog listener.
     * In a production scenario, this would be a long-running process
     * listening to the MySQL binlog protocol or a Debezium Kafka consumer.
     */
    public function captureChange(string $sourceDb, string $targetDb, string $table, array $data, string $type): CdcChange
    {
        Log::info("CDC Captured: {$type} on {$table} for migration {$sourceDb} -> {$targetDb}");
        
        return CdcChange::create([
            'operation_type' => $type,
            'table_name' => $table,
            'payload' => $data,
            'binlog_position' => rand(1000, 9999999), 
            'source_db' => $sourceDb,
            'target_db' => $targetDb,
            'captured_at' => now(),
            'replayed' => false
        ]);
    }

    /**
     * Replay pending changes to the target PostgreSQL database
     */
    public function replayPendingChanges(string $sourceDb, string $targetDb): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, CdcChange> $pending */
        $pending = CdcChange::where('source_db', $sourceDb)
            ->where('target_db', $targetDb)
            ->where('replayed', false)
            ->orderBy('captured_at', 'asc')
            ->get();

        $replayedCount = 0;
        $errors = [];

        /** @var CdcChange $change */
        foreach ($pending as $change) {
            try {
                $this->executeChangeOnTarget($targetDb, $change);
                
                $change->update([
                    'replayed' => true,
                    'replayed_at' => now()
                ]);
                
                $replayedCount++;
            } catch (\Exception $e) {
                Log::error("CDC Replay Error: " . $e->getMessage());
                $errors[] = [
                    'change_id' => $change->id,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'replayed_count' => $replayedCount,
            'errors' => $errors
        ];
    }

    /**
     * Executes the captured change as equivalent PostgreSQL SQL
     */
    private function executeChangeOnTarget(string $targetDb, CdcChange $change): void
    {
        // Switch to the target database connection dynamically
        // Implementation assumes 'temp_pgsql' is configured in the controller
        $conn = DB::connection('temp_pgsql');
        $table = $change->table_name;
        $payload = $change->payload;

        switch (strtoupper($change->operation_type)) {
            case 'INSERT':
                $conn->table($table)->insert($payload);
                break;
                
            case 'UPDATE':
                if (isset($payload['id'])) {
                    $id = $payload['id'];
                    unset($payload['id']);
                    $conn->table($table)->where('id', $id)->update($payload);
                }
                break;
                
            case 'DELETE':
                if (isset($payload['id'])) {
                    $conn->table($table)->where('id', $payload['id'])->delete();
                }
                break;
        }
    }
}
