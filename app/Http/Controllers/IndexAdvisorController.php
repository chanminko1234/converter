<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\DatabaseAdapters\SourceAdapterFactory;
use App\Services\GeminiService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class IndexAdvisorController extends Controller
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Analyze a live database schema and suggest advanced PostgreSQL indexes
     */
    public function advise(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source' => 'required|array',
            'source_type' => 'sometimes|string|in:mysql,oracle,sqlserver,sqlsrv,sql_server',
            'source.host' => 'required|string',
            'source.port' => 'required|string',
            'source.user' => 'required|string',
            'source.pass' => 'present|string|nullable',
            'source.db' => 'required|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $source = $request->input('source');
        $sourceType = $request->input('source_type', 'mysql');

        try {
            $adapter = app(SourceAdapterFactory::class)->create($sourceType);
            $adapter->setupConnection($source);

            $tables = $adapter->getTables();
            $allRecommendations = [];

            // For performance, we'll only analyze the first 10 tables or key tables
            // In a real environment, this might be interactive/paginated
            $analysisLimit = 15;
            $analyzedCount = 0;

            foreach ($tables as $tableName) {
                if ($analyzedCount >= $analysisLimit) break;

                $columns = $adapter->getTableSchema($tableName); // Get basic schema info
                
                // Fetch structured column info for the AI
                $tableMetadata = [
                    'name' => $tableName,
                    'columns' => $adapter->getTableData($tableName)->limit(0)->get()->toArray(), // Get column list
                ];

                $suggestions = $this->gemini->suggestOptimizations($tableName, $tableMetadata['columns']);
                
                if ($suggestions && !empty($suggestions['indexing_suggestions'])) {
                    $allRecommendations[] = [
                        'table' => $tableName,
                        'suggestions' => $suggestions['indexing_suggestions']
                    ];
                    $analyzedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'recommendations' => $allRecommendations,
                    'analyzed_tables' => $analyzedCount,
                    'total_tables' => count($tables)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Index analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
