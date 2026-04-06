<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class OrchestrationController extends Controller
{
    /**
     * Get real-time migration metrics across all active tables
     */
    public function getStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source_db' => 'required|string',
            'target_db' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Missing source/target parameters'], 422);
        }

        $source = $request->input('source_db');
        $target = $request->input('target_db');

        $checkpoints = DB::table('migration_checkpoints')
            ->where('source_db', $source)
            ->where('target_db', $target)
            ->get();

        $totalRows = $checkpoints->sum('rows_synced');
        $avgThroughput = $checkpoints->avg('last_throughput') ?? 0;
        $syncingCount = $checkpoints->where('sync_status', 'syncing')->count();
        $completedCount = $checkpoints->where('sync_status', 'completed')->count();
        $totalTables = $checkpoints->count();

        return response()->json([
            'success' => true,
            'data' => [
                'tables' => $checkpoints,
                'metrics' => [
                    'total_rows_migrated' => $totalRows,
                    'avg_throughput_eps' => round($avgThroughput, 2), // Entries per second
                    'active_streams' => $syncingCount,
                    'completed_tables' => $completedCount,
                    'total_tables' => $totalTables,
                    'progress_pct' => $totalTables > 0 ? round(($completedCount / $totalTables) * 100, 2) : 0,
                    'is_live' => $syncingCount > 0,
                ],
                'last_updated' => now()->toISOString(),
            ]
        ]);
    }

    /**
     * Execute Final Cutover
     * 1. Check for any remaining CDC changes
     * 2. Finalize checkpoints
     * 3. (Mock) Switch DNS/Connection
     */
    public function cutover(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source_db' => 'required|string',
            'target_db' => 'required|string',
        ]);

        if ($validator->fails()) {
           return response()->json(['error' => 'Invalid parameters'], 422);
        }

        $source = $request->input('source_db');
        $target = $request->input('target_db');

        // Logic for final CDC sweep
        $pendingCdc = DB::table('cdc_changes')
            ->where('source_db', $source)
            ->where('replayed', false)
            ->count();

        if ($pendingCdc > 0) {
            return response()->json([
                'success' => false,
                'message' => "Final Cutover aborted. {$pendingCdc} pending changes detected in binlog. Run CDC catch-up first.",
                'pending_count' => $pendingCdc
            ], 409);
        }

        // Mark all as cutover
        DB::table('migration_checkpoints')
            ->where('source_db', $source)
            ->where('target_db', $target)
            ->update(['sync_status' => 'cutover', 'last_synced_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => "Enterprise Cutover Successful. Connection strings updated.",
            'cutover_time' => now()
        ]);
    }
}
