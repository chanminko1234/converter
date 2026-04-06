<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY', '');
    }

    /**
     * Transpile MySQL procedural logic (Triggers/Stored Procedures) to PL/pgSQL
     */
    public function transpileProcedural(string $mysqlSql): ?array
    {
        if (empty($this->apiKey) || empty($mysqlSql)) {
            return null;
        }

        $prompt = <<<PROMPT
You are a database migration expert. Your task is to transpile the following MySQL procedural code (Trigger, Stored Procedure, or Stored Function) into PostgreSQL PL/pgSQL syntax.

MySQL Code:
```sql
{$mysqlSql}
```

Constraints:
1. Ensure identical behavior.
2. Use standard PostgreSQL best practices (e.g., using `RETURNS TRIGGER` and a trigger function for triggers).
3. Handle MySQL-specific syntax like `NEW.col`, `OLD.col`, `DELIMITER`, etc.
4. Return ONLY a JSON object with the following structure:
{
  "sql": "the converted postgresql code",
  "explanation": "concise explanation of what was changed",
  "warnings": ["any potential compatibility risks"]
}
PROMPT;

        return $this->callGemini($prompt);
    }

    /**
     * Analyze table schema and suggest PostgreSQL-specific optimizations
     */
    public function suggestOptimizations(string $tableName, array $columns): ?array
    {
        if (empty($this->apiKey) || empty($columns)) {
            return null;
        }

        $columnsJson = json_encode($columns, JSON_PRETTY_PRINT);
        
        $prompt = <<<PROMPT
You are a PostgreSQL architectural optimization expert. Analyze the following MySQL table structure and suggest PostgreSQL-native improvements (e.g., JSONB, GIN indexes, partial indexes, partitioning, specific data types).

Table Name: {$tableName}
Columns and Types:
{$columnsJson}

Return ONLY a JSON object with the following structure:
{
  "suggestions": [
    {
      "column": "column_name",
      "original_type": "original_type",
      "suggested_type": "suggested_type",
      "reason": "why this is better in PostgreSQL",
      "sql": "ALTER TABLE statement if applicable"
    }
  ],
  "indexing_suggestions": [
    {
      "type": "GIN|BRIN|PARTIAL|etc",
      "columns": ["col1"],
      "reason": "why this index is recommended",
      "sql": "CREATE INDEX statement"
    }
  ]
}
PROMPT;

        return $this->callGemini($prompt);
    }

    /**
     * Analyze slow query logs and recommend performance improvements for PostgreSQL
     */
    public function analyzeSlowLogs(string $slowLog, float $volGb): ?array
    {
        if (empty($this->apiKey) || empty($slowLog)) {
            return null;
        }
        
        $prompt = <<<PROMPT
You are a PostgreSQL tuning specialist. Analyze the following MySQL slow query log snippet and suggest PostgreSQL-specific improvements (e.g., config parameter adjustments, indexing changes, query refactoring for PG compatibility).

Slow Query Log:
```text
{\$slowLog}
```

Target Context:
- Data Volume: {\$volGb}GB
- Migration: MySQL to PostgreSQL

Return ONLY a JSON object with the following structure:
{
  "parameter_tweaks": [
    {
      "parameter": "shared_buffers|work_mem|etc",
      "suggested_value": "new_value",
      "reason": "why this is recommended based on the log"
    }
  ],
  "indexing_insights": [
    {
      "table": "table_name",
      "sql": "CREATE INDEX ...",
      "reason": "why this avoids the sequential scans detected in the log"
    }
  ],
  "structural_warnings": ["any major performance blockers for PG found in the query patterns"]
}
PROMPT;

        return $this->callGemini($prompt);
    }

    /**
     * Base call to Gemini API
     */
    protected function callGemini(string $prompt): ?array
    {
        try {
            $response = Http::post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'topK' => 1,
                    'topP' => 1,
                    'maxOutputTokens' => 2048,
                    'responseMimeType' => 'application/json'
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $responseText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                
                if ($responseText) {
                    // Clean up potential markdown formatting if the model didn't strictly follow JSON output
                    $cleanedText = preg_replace('/^```json\s*|\s*```$/i', '', trim($responseText));
                    return json_decode($cleanedText, true);
                }
            }
            
            Log::error('Gemini API Error: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('Gemini Service Exception: ' . $e->getMessage());
            return null;
        }
    }
}
