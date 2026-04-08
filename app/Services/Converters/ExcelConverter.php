<?php

namespace App\Services\Converters;

use App\Services\SQL\SQLParserService;
use OpenSpout\Writer\XLSX\Writer;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Cell;

class ExcelConverter
{
    protected SQLParserService $sqlParser;

    public function __construct(SQLParserService $sqlParser)
    {
        $this->sqlParser = $sqlParser;
    }

    /**
     * Convert MySQL dump to Excel (XLSX) using streaming
     * 
     * Note: Excel is not a plain-text format, so we can't easily 'yield' chunks 
     * in the same way as SQL or CSV. We use OpenSpout to write directly to 
     * a temporary file or output.
     */
    public function convert($input, array $options, string $sourceType): void
    {
        $schema = $this->sqlParser->parseMysqlDump($input, $options);
        
        $writer = new Writer();
        $writer->openToBrowser('converted_data.xlsx');

        $sheetMap = [];
        foreach ($schema['tables'] as $name => $table) {
            if (empty($sheetMap)) {
                $sheet = $writer->getCurrentSheet();
            } else {
                $sheet = $writer->addNewSheetAndMakeItCurrent();
            }
            $sheet->setName(substr($name, 0, 31));
            $sheetMap[$name] = $sheet;

            // Header Row
            $headerCells = array_map(fn($col) => Cell::fromValue($col['name']), $table['columns']);
            $writer->addRow(new Row($headerCells));
        }

        // Stream Data Lines
        $fp = $this->sqlParser->openSqlStream($input);
        $currentTable = null;

        while (($line = fgets($fp)) !== false) {
            $trimmed = trim($line);
            if (empty($trimmed) || !stripos($trimmed, 'INSERT INTO')) continue;

            // Simple table name extraction from INSERT INTO `table` ...
            if (preg_match('/INSERT\s+INTO\s+[`"]?([^`"\s]+)[`"]?/i', $trimmed, $m)) {
                $tableName = $m[1];
                if (isset($sheetMap[$tableName])) {
                    $writer->setCurrentSheet($sheetMap[$tableName]);
                    $currentTable = $tableName;
                }
            }

            if ($currentTable) {
                // Apply masking if requested
                $line = $this->sqlParser->maskSensitiveData($line, $options, $schema['tables'] ?? []);
                
                // Extract values part: VALUES (v1, v2), (v3, v4);
                if (preg_match('/VALUES\s+(.*);?$/i', trim($line), $vm)) {
                    $valuesPart = $vm[1];
                    // Split values into individual rows
                    $rows = preg_split('/\),\s*\(/', trim($valuesPart, '() '));
                    
                    foreach ($rows as $rowValuesStr) {
                        $values = explode(',', $rowValuesStr);
                        $cells = array_map(fn($v) => Cell::fromValue(trim($v, "'\" ")), $values);
                        $writer->addRow(new Row($cells));
                    }
                }
            }
        }
        
        if ($fp) fclose($fp);

        $writer->close();
    }
}
