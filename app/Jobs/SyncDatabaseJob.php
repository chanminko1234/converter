<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use Illuminate\Support\Facades\Log;
use App\Traits\ValidatesDatabaseHost;

class SyncDatabaseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, ValidatesDatabaseHost;

    protected $source;
    protected $target;
    protected $options;
    protected $sourceType;

    public function __construct($source, $target, $options, $sourceType)
    {
        $this->source = $source;
        $this->target = $target;
        $this->options = $options;
        $this->sourceType = $sourceType;
    }

    public function handle(): void
    {
        try {
            $adapter = app(SourceAdapterFactory::class)->create($this->sourceType);
            $adapter->setupConnection($this->source);
            
            $targetConnName = $this->target['connection'] ?? 'job_target_pgsql';
            if ($targetConnName === 'job_target_pgsql') {
                $targetHost = $this->target['host'] ?? 'localhost';
                $this->validateHost($targetHost);

                Config::set('database.connections.job_target_pgsql', [
                    'driver' => 'pgsql',
                    'host' => $targetHost,
                    'port' => $this->target['port'] ?? '5432',
                    'database' => $this->target['db'] ?? '',
                    'username' => $this->target['user'] ?? '',
                    'password' => $this->target['pass'] ?? '',
                    'charset' => 'utf8',
                    'prefix' => '',
                    'schema' => 'public',
                    'sslmode' => 'prefer',
                ]);
                DB::purge('job_target_pgsql');
            }
            
            $tables = $adapter->getTables();
            
            foreach ($tables as $tableName) {
                // Simplified logic for background sync
                $trackCol = 'id';
                $rowCount = 0;
                
                // Track progress in checkpoints
                DB::table('migration_checkpoints')->updateOrInsert(
                    ['source_db' => $this->source['db'], 'target_db' => $this->target['db'], 'table_name' => $tableName],
                    ['sync_status' => 'syncing', 'last_synced_at' => now()]
                );

                $adapter->getTableData($tableName)->chunk(500, function($rows) use ($tableName, &$rowCount, $trackCol, $targetConnName) {
                    $insertData = array_map(fn($r) => (array)$r, $rows->toArray());
                    if (!empty($insertData)) {
                        $start = microtime(true);
                        DB::connection($targetConnName)->table($tableName)->insert($insertData);
                        $duration = microtime(true) - $start;
                        
                        $rowCount += count($insertData);
                        DB::table('migration_checkpoints')->where('table_name', $tableName)->update([
                            'rows_synced' => $rowCount,
                            'last_throughput' => count($insertData) / ($duration ?: 0.1),
                            'last_synced_at' => now()
                        ]);
                    }
                });

                DB::table('migration_checkpoints')->where('table_name', $tableName)->update(['sync_status' => 'completed']);
            }
        } catch (\Exception $e) {
            Log::error("Migration Job Failed: " . $e->getMessage());
        }
    }
}
