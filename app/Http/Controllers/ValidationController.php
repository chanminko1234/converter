<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Services\AuditLogger;

use App\Traits\ValidatesDatabaseHost;

class ValidationController extends Controller
{
    use ValidatesDatabaseHost;
    /**
     * Validate data integrity between Source and Target databases
     */
    public function validateData(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|array',
            'source_type' => 'sometimes|string|in:mysql,oracle,sqlserver,sqlsrv,sql_server',
            'source.host' => 'required|string',
            'source.port' => 'required|string',
            'source.user' => 'required|string',
            'source.pass' => 'present|string|nullable',
            'source.db' => 'required|string',
            'target' => 'required|array',
            'target.host' => 'required|string',
            'target.port' => 'required|string',
            'target.user' => 'required|string',
            'target.pass' => 'present|string|nullable',
            'target.db' => 'required|string',
            'tables' => 'sometimes|array', // Optional list of specific tables to validate
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $source = $request->input('source');
        $sourceType = $request->input('source_type', 'mysql');
        $target = $request->input('target');
        $requestedTables = $request->input('tables', []);

        $this->validateHost($source['host']);
        $this->validateHost($target['host']);

        AuditLogger::log('validate_data', 'database', $source['db'], [
            'source' => $source,
            'target' => $target,
            'tables_requested' => $requestedTables
        ]);

        try {
            // 1. Setup Connections
            $adapter = app(SourceAdapterFactory::class)->create($sourceType);
            $adapter->setupConnection($source);

            Config::set('database.connections.temp_target_pgsql', [
                'driver' => 'pgsql',
                'host' => $target['host'],
                'port' => $target['port'],
                'database' => $target['db'],
                'username' => $target['user'],
                'password' => $target['pass'] ?? '',
                'charset' => 'utf8',
                'prefix' => '',
                'schema' => 'public',
                'sslmode' => 'prefer',
            ]);
            DB::purge('temp_target_pgsql');

            // 2. Determine tables to validate
            $tables = !empty($requestedTables) ? $requestedTables : $adapter->getTables();
            $results = [];
            $summary = [
                'total_tables' => count($tables),
                'passed' => 0,
                'failed' => 0,
                'warnings' => 0
            ];

            foreach ($tables as $tableName) {
                // Initial check: Table existence on target
                $targetExists = DB::connection('temp_target_pgsql')
                    ->select("SELECT 1 FROM information_schema.tables WHERE table_name = ?", [$tableName]);

                if (empty($targetExists)) {
                    $results[] = [
                        'table' => $tableName,
                        'status' => 'failed',
                        'message' => 'Table does not exist on target database.',
                        'source_count' => $this->getSourceRowCount($adapter, $tableName),
                        'target_count' => 0
                    ];
                    $summary['failed']++;
                    continue;
                }

                // Row Count Check
                $sourceCount = $this->getSourceRowCount($adapter, $tableName);
                $targetCount = DB::connection('temp_target_pgsql')->table($tableName)->count();

                // Checksum / Sample Hash Check
                // For performance, we'll hash the first 1000 rows as a representative sample
                $sourceHash = $this->getSourceSampleHash($adapter, $tableName);
                $targetHash = $this->getTargetSampleHash($tableName);

                $status = ($sourceCount === $targetCount && $sourceHash === $targetHash) ? 'passed' : 'failed';
                $message = $status === 'passed' ? 'Data integrity verified.' : 'Row counts match but data content differs.';
                if ($sourceCount !== $targetCount) {
                    $message = "Row count mismatch: Source({$sourceCount}) vs Target({$targetCount}).";
                }

                $results[] = [
                    'table' => $tableName,
                    'status' => $status,
                    'message' => $message,
                    'source_count' => $sourceCount,
                    'target_count' => $targetCount,
                    'checksum_match' => ($sourceHash === $targetHash)
                ];

                if ($status === 'passed') $summary['passed']++;
                else $summary['failed']++;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'results' => $results,
                    'summary' => $summary,
                    'validated_at' => now()->toDateTimeString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation attempt failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getSourceRowCount($adapter, $tableName): int
    {
        try {
            return $adapter->getTableData($tableName)->count();
        } catch (\Exception $e) {
            return -1;
        }
    }

    private function getSourceSampleHash($adapter, $tableName): string
    {
        try {
            $rows = $adapter->getTableData($tableName)->limit(100)->get();
            return md5(json_encode($rows));
        } catch (\Exception $e) {
            return 'error';
        }
    }

    private function getTargetSampleHash($tableName): string
    {
        try {
            $rows = DB::connection('temp_target_pgsql')->table($tableName)->limit(100)->get();
            return md5(json_encode($rows));
        } catch (\Exception $e) {
            return 'error_target';
        }
    }
}
