<?php

namespace App\Services;

use App\Services\Converters\ConverterFactory;
use App\Services\Converters\ExcelConverter;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConversionOrchestrator
{
    protected ConverterFactory $converterFactory;
    protected AI\GeminiService $gemini;
    protected SQL\SQLParserService $sqlParser;

    public function __construct(ConverterFactory $converterFactory, AI\GeminiService $gemini, SQL\SQLParserService $sqlParser)
    {
        $this->converterFactory = $converterFactory;
        $this->gemini = $gemini;
        $this->sqlParser = $sqlParser;
    }

    /**
     * Orchestrate the conversion and return a stream response
     */
    public function streamDownload($input, string $targetFormat, array $options, string $sourceType, string $filename): StreamedResponse
    {
        return response()->streamDownload(function() use ($input, $targetFormat, $options, $sourceType) {
            $converter = $this->converterFactory->create($targetFormat);
            
            if ($converter instanceof ExcelConverter) {
                return $converter->convert($input, $options, $sourceType);
            }

            $schema = $this->sqlParser->parseMysqlDump($input, $options);
            if (!($schema['has_valid_sql_keywords'] ?? true)) {
                echo "-- Error: The provided input does not appear to be a valid SQL dump (no CREATE/INSERT/UPDATE keywords found).";
                return;
            }

            $generator = $converter->convert($input, $options, $sourceType);

            foreach ($generator as $chunk) {
                echo $chunk;
                if (ob_get_level() > 0) ob_flush();
                flush();
            }
        }, $filename);
    }

    /**
     * High-level orchestration that handles JSON vs Stream based on request
     */
    public function convertToResponse($input, string $targetFormat, array $options, string $sourceType, bool $wantsJson = false): StreamedResponse|JsonResponse
    {
        if (!$wantsJson) {
            return $this->streamDownload($input, $targetFormat, $options, $sourceType, "conversion_" . now()->getTimestamp() . ".sql");
        }

        $converter = $this->converterFactory->create($targetFormat);
        
        $sql = "";
        if ($converter instanceof ExcelConverter) {
            // Excel can't be JSON easily, return stream anyway
            return $this->streamDownload($input, $targetFormat, $options, $sourceType, "conversion.xlsx");
        }

        // Schema Pass for metadata
        $schema = $this->sqlParser->parseMysqlDump($input, $options);
        
        if (!($schema['has_valid_sql_keywords'] ?? true)) {
             return response()->json([
                 'success' => false,
                 'error' => 'The provided input does not appear to be a valid SQL dump (no CREATE/INSERT/UPDATE keywords found).',
             ], 422);
        }

        $generator = $converter->convert($input, $options, $sourceType);
        $maxJsonSize = 10 * 1024 * 1024; // 10MB safety limit for JSON strings
        foreach ($generator as $chunk) {
            $sql .= $chunk;
            if (strlen($sql) > $maxJsonSize) {
                $sql .= "\n\n-- [TRUNCATED] Results exceed 10MB safety limit for JSON. Please use the streaming download endpoint for the full migration script.";
                $report[] = [
                    'type' => 'warning',
                    'message' => 'The resulting SQL is very large and has been truncated in this JSON response for performance reasons. Please download the full file instead.'
                ];
                break;
            }
        }
        
        $report = [];
        $this->sqlParser->performAutoCleaning($schema, $options, $report);

        $preset = $options['frameworkPreset'] ?? $options['framework_preset'] ?? 'none';
        if ($preset !== 'none') {
            $report[] = [
                'type' => 'info',
                'message' => (strtolower($preset) === 'wordpress' ? 'WordPress' : ucfirst($preset)) . " framework optimizations applied to schema."
            ];
        }

        // AI-Enhanced Refactoring
        if ($options['predictiveRefactoring'] ?? $options['predictive_refactoring'] ?? false) {
             $apply = $options['applyAiRefactoring'] ?? $options['apply_ai_refactoring'] ?? false;
             if (!$apply) {
                 $report[] = [
                     'type' => 'warning',
                     'message' => 'AI Review Mode engaged: Analysis complete, but predictive refactorings have been withheld. Enable "Apply AI Refactorings" to commit these structural changes.'
                 ];
             }
             foreach ($schema['tables'] as $name => $table) {
                 $suggestions = $this->gemini->suggestOptimizations($name, $table['columns']);
                 if ($suggestions && !empty($suggestions['suggestions'])) {
                     foreach ($suggestions['suggestions'] as $s) {
                         $report[] = [
                             'type' => 'info',
                             'message' => "AI Recommendation ({$s['column']}): {$s['reason']}",
                             'suggestion' => $s
                         ];
                     }
                 }

                 // Capture column-level predictive refactoring insights for the report
                 foreach ($table['columns'] as $col) {
                     $this->sqlParser->convertMysqlColumnToPostgreSQL($col, $options, $report);
                 }
             }
             
             if (($options['trigger_handling'] ?? '') === 'convert') {
                  $aiTranspiled = $this->gemini->transpileProcedural($input instanceof \Illuminate\Http\UploadedFile ? file_get_contents($input->path()) : $input);
                  if ($aiTranspiled && !empty($aiTranspiled['sql'])) {
                       $sql .= "\n\n-- AI Transpiled Object --\n" . $aiTranspiled['sql'];
                       $report[] = [
                            'type' => 'info',
                            'message' => 'AI Transpiled Object: ' . ($aiTranspiled['explanation'] ?? '')
                       ];
                  }
             }
        }

        $rollback = method_exists($converter, 'generateRollbackSQL') ? $converter->generateRollbackSQL($schema) : "";
        $validation = method_exists($converter, 'generateIntegrityValidationScript') ? $converter->generateIntegrityValidationScript($schema) : "";

        $dataResponse = [
            'sql' => $sql,
            'format' => $targetFormat,
            'report' => $report,
            'validation_sql' => $validation
        ];

        if ($targetFormat === 'csv') {
             $files = [];
             $tableSegments = preg_split('/^-- Table: /m', $sql);
             foreach ($tableSegments as $seg) {
                 if (empty($seg)) continue;
                 $lines = explode("\n", $seg, 2);
                 $tableName = trim($lines[0]);
                 if (isset($lines[1])) {
                     $files[$tableName] = trim($lines[1]);
                 }
             }
             $dataResponse['files'] = $files;
        }

        return response()->json([
            'success' => true,
            'data' => $dataResponse,
            'rollback' => $rollback,
            'metadata' => [
                'target_format' => $targetFormat,
                'processing_time' => '0.0ms',
                'tables_processed' => count($schema['tables'] ?? [])
            ]
        ]);
    }
}
