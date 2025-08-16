import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Download, Upload, Play, FileText, Settings, Database, FileSpreadsheet, HardDrive, Terminal, Diff } from 'lucide-react';
import { MySQLToPostgreSQLConverter, ConversionReport } from '@/lib/sqlConverter';
import { CodeHighlighter } from '@/components/ui/syntax-highlighter';
import { ThemeToggle } from '@/components/theme-toggle';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

type TargetFormat = 'postgresql' | 'csv' | 'xlsx' | 'xls' | 'sqlite' | 'psql';

interface ConversionOptions {
  preserveIdentity: boolean;
  handleEnums: 'varchar' | 'check_constraint' | 'enum_table';
  handleSets: 'varchar' | 'array' | 'separate_table';
  timezoneHandling: 'utc' | 'local' | 'preserve';
  triggerHandling: 'convert' | 'comment' | 'skip';
  replaceHandling: 'upsert' | 'insert_ignore' | 'error';
  ignoreHandling: 'on_conflict_ignore' | 'skip' | 'error';
  // CSV options
  csvDelimiter: string;
  csvEnclosure: string;
  csvIncludeHeaders: boolean;
  // Excel options
  excelSheetPerTable: boolean;
  excelIncludeMetadata: boolean;
  // SQLite options
  sqliteForeignKeys: boolean;
  sqliteWalMode: boolean;
}

const Welcome: React.FC = () => {
  const [mysqlInput, setMysqlInput] = useState('');
  const [output, setOutput] = useState('');
  const [diffOutput, setDiffOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionReport, setConversionReport] = useState<ConversionReport[]>([]);
  const [error, setError] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('postgresql');
  const [activeTab, setActiveTab] = useState('output');
  const [conversionData, setConversionData] = useState<any>(null);
  const [converter] = useState(() => new MySQLToPostgreSQLConverter());
  
  const [options, setOptions] = useState<ConversionOptions>({
    preserveIdentity: true,
    handleEnums: 'check_constraint',
    handleSets: 'array',
    timezoneHandling: 'utc',
    triggerHandling: 'convert',
    replaceHandling: 'upsert',
    ignoreHandling: 'on_conflict_ignore',
    csvDelimiter: ',',
    csvEnclosure: '"',
    csvIncludeHeaders: true,
    excelSheetPerTable: true,
    excelIncludeMetadata: false,
    sqliteForeignKeys: true,
    sqliteWalMode: true,
  });
  
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ⌘⏎ (Cmd+Enter) for convert
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isConverting && mysqlInput.trim()) {
          handleConvert();
        }
      }
      
      // ⌘K (Cmd+K) for command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Escape to close command palette
      if (event.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConverting, mysqlInput, showCommandPalette]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setError('Please upload a valid SQL file (.sql or .txt)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content.length === 0) {
          setError('The uploaded file is empty');
          return;
        }
        setMysqlInput(content);
      } catch (err) {
        setError('Failed to read the file content');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file');
    };
    
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!conversionData) {
      toast.error('No conversion data available for download');
      return;
    }
    
    try {
      if (targetFormat === 'xlsx' || targetFormat === 'xls') {
        // Handle Excel files - decode base64 content
        const binaryString = atob(conversionData.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: conversionData.mime_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = conversionData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${conversionData.filename}`);
        
      } else if (targetFormat === 'csv') {
        // Handle CSV files - create individual files or ZIP archive
        const files = conversionData.files;
        if (Object.keys(files).length === 1) {
          // Single file - download directly
          const [tableName, content] = Object.entries(files)[0] as [string, string];
          const blob = new Blob([content], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${tableName}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`Downloaded ${tableName}.csv`);
        } else {
          // Multiple files - would need ZIP library for proper implementation
          // For now, download the first file as an example
          const [tableName, content] = Object.entries(files)[0] as [string, string];
          const blob = new Blob([content], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${tableName}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.info(`Downloaded ${tableName}.csv (first of ${Object.keys(files).length} files)`);
        }
        
      } else {
        // Handle SQL formats (postgresql, sqlite, psql)
        const content = conversionData.sql || conversionData.script || output;
        const getFileExtension = () => {
          switch (targetFormat) {
            case 'postgresql': return '.sql';
            case 'psql': return '.sh';
            case 'sqlite': return '.sql';
            default: return '.sql';
          }
        };
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_${targetFormat}${getFileExtension()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded converted_${targetFormat}${getFileExtension()}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleConvert = async () => {
    if (!mysqlInput.trim()) {
      setError('Please enter some MySQL code to convert');
      return;
    }
    
    setIsConverting(true);
    setError('');
    setConversionReport([]);
    setOutput('');
    setDiffOutput('');
    
    try {
      const response = await fetch('/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          mysql_dump: mysqlInput,
          target_format: targetFormat,
          options: options
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed');
      }
      
      // Handle different response formats based on target format
      const data = result.data;
      setConversionData(data); // Store the raw conversion data for downloads
      
      if (targetFormat === 'xlsx' || targetFormat === 'xls') {
        // For Excel files, store the base64 content and metadata
        setOutput(`Excel file generated: ${data.filename}\nFormat: ${data.format}\nMIME Type: ${data.mime_type}`);
        setDiffOutput('Excel files do not support diff view');
        setConversionReport([{ type: 'info', message: `Excel file ready for download: ${data.filename}` }]);
      } else if (targetFormat === 'csv') {
        // For CSV files, display the files content
        const csvContent = Object.entries(data.files)
          .map(([tableName, content]) => `-- Table: ${tableName}\n${content}`)
          .join('\n\n');
        setOutput(csvContent);
        setDiffOutput('CSV files do not support diff view');
        setConversionReport([{ type: 'info', message: `Generated ${Object.keys(data.files).length} CSV files` }]);
      } else {
        // For SQL formats (postgresql, sqlite, psql)
        setOutput(data.sql || data.script || '');
        setDiffOutput(result.diff || '');
        setConversionReport(result.report || []);
      }
      
      // Show success toast
      toast.success(`Successfully converted to ${targetFormat.toUpperCase()}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Conversion failed: ${errorMessage}`);
      setOutput('');
      setDiffOutput('');
      setConversionReport([]);
      
      // Show error toast
      toast.error('Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              MySQL to PostgreSQL Converter
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Convert your MySQL database schemas and queries to PostgreSQL format with ease.
              Supports table definitions, data types, and common SQL syntax transformations.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Target Format Selector & Options */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="target-format">Target Format:</Label>
              <Select value={targetFormat} onValueChange={(value: TargetFormat) => setTargetFormat(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      PostgreSQL
                    </div>
                  </SelectItem>
                  <SelectItem value="psql">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      psql Script
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="xlsx">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="xls">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel (.xls)
                    </div>
                  </SelectItem>
                  <SelectItem value="sqlite">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      SQLite
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Options
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Conversion Options</SheetTitle>
                <SheetDescription>
                  Configure how your MySQL data should be converted to {targetFormat.toUpperCase()}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto">
                {/* General Options */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">General Options</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="preserve-identity" 
                      checked={options.preserveIdentity}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, preserveIdentity: !!checked }))}
                    />
                    <Label htmlFor="preserve-identity">Preserve Identity/Auto-increment</Label>
                  </div>
                </div>
                
                {/* MySQL-specific Handling */}
                {(targetFormat === 'postgresql' || targetFormat === 'sqlite') && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">MySQL-specific Handling</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="enum-handling">ENUM Handling</Label>
                      <Select 
                        value={options.handleEnums} 
                        onValueChange={(value: 'varchar' | 'check_constraint' | 'enum_table') => 
                          setOptions(prev => ({ ...prev, handleEnums: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="varchar">Convert to VARCHAR</SelectItem>
                          <SelectItem value="check_constraint">Use CHECK constraint</SelectItem>
                          <SelectItem value="enum_table">Create lookup table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="set-handling">SET Handling</Label>
                      <Select 
                        value={options.handleSets} 
                        onValueChange={(value: 'varchar' | 'array' | 'separate_table') => 
                          setOptions(prev => ({ ...prev, handleSets: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="varchar">Convert to VARCHAR</SelectItem>
                          <SelectItem value="array">Use ARRAY type (PostgreSQL)</SelectItem>
                          <SelectItem value="separate_table">Create junction table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone-handling">Timezone Handling</Label>
                      <Select 
                        value={options.timezoneHandling} 
                        onValueChange={(value: 'utc' | 'local' | 'preserve') => 
                          setOptions(prev => ({ ...prev, timezoneHandling: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">Convert to UTC</SelectItem>
                          <SelectItem value="local">Use local timezone</SelectItem>
                          <SelectItem value="preserve">Preserve original</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trigger-handling">Trigger Handling</Label>
                      <Select 
                        value={options.triggerHandling} 
                        onValueChange={(value: 'convert' | 'comment' | 'skip') => 
                          setOptions(prev => ({ ...prev, triggerHandling: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="convert">Convert to target syntax</SelectItem>
                          <SelectItem value="comment">Comment out</SelectItem>
                          <SelectItem value="skip">Skip entirely</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="replace-handling">REPLACE Handling</Label>
                      <Select 
                        value={options.replaceHandling} 
                        onValueChange={(value: 'upsert' | 'insert_ignore' | 'error') => 
                          setOptions(prev => ({ ...prev, replaceHandling: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upsert">Convert to UPSERT</SelectItem>
                          <SelectItem value="insert_ignore">Convert to INSERT IGNORE</SelectItem>
                          <SelectItem value="error">Throw error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ignore-handling">INSERT IGNORE Handling</Label>
                      <Select 
                        value={options.ignoreHandling} 
                        onValueChange={(value: 'on_conflict_ignore' | 'skip' | 'error') => 
                          setOptions(prev => ({ ...prev, ignoreHandling: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_conflict_ignore">ON CONFLICT DO NOTHING</SelectItem>
                          <SelectItem value="skip">Skip statement</SelectItem>
                          <SelectItem value="error">Throw error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {/* Format-specific options */}
                {targetFormat === 'csv' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">CSV Options</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="csv-headers" 
                        checked={options.csvIncludeHeaders}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, csvIncludeHeaders: !!checked }))}
                      />
                      <Label htmlFor="csv-headers">Include Headers</Label>
                    </div>
                  </div>
                )}
                
                {(targetFormat === 'xlsx' || targetFormat === 'xls') && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Excel Options</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="excel-sheet-per-table" 
                        checked={options.excelSheetPerTable}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excelSheetPerTable: !!checked }))}
                      />
                      <Label htmlFor="excel-sheet-per-table">Separate sheet per table</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="excel-metadata" 
                        checked={options.excelIncludeMetadata}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excelIncludeMetadata: !!checked }))}
                      />
                      <Label htmlFor="excel-metadata">Include metadata</Label>
                    </div>
                  </div>
                )}
                
                {targetFormat === 'sqlite' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">SQLite Options</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sqlite-foreign-keys" 
                        checked={options.sqliteForeignKeys}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, sqliteForeignKeys: !!checked }))}
                      />
                      <Label htmlFor="sqlite-foreign-keys">Enable foreign keys</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sqlite-wal" 
                        checked={options.sqliteWalMode}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, sqliteWalMode: !!checked }))}
                      />
                      <Label htmlFor="sqlite-wal">Enable WAL mode</Label>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Two-Pane Editor Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* MySQL Input Pane */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                MySQL Input
              </CardTitle>
              <CardDescription>
                Paste your MySQL schema or queries here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="CREATE TABLE users (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  email VARCHAR(255) UNIQUE\n);"
                  value={mysqlInput}
                  onChange={(e) => setMysqlInput(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleConvert}
                    disabled={!mysqlInput.trim() || isConverting}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {isConverting ? 'Converting...' : 'Convert'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Pane with Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {targetFormat === 'postgresql' && <Database className="h-5 w-5" />}
                {targetFormat === 'psql' && <Terminal className="h-5 w-5" />}
                {targetFormat === 'csv' && <FileText className="h-5 w-5" />}
                {(targetFormat === 'xlsx' || targetFormat === 'xls') && <FileSpreadsheet className="h-5 w-5" />}
                {targetFormat === 'sqlite' && <HardDrive className="h-5 w-5" />}
                {targetFormat.toUpperCase()} Output
              </CardTitle>
              <CardDescription>
                Converted {targetFormat.toUpperCase()} code will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="diff">Diff</TabsTrigger>
                  <TabsTrigger value="report">Report</TabsTrigger>
                </TabsList>
                
                <TabsContent value="output" className="space-y-4">
                  {output ? (
                    <CodeHighlighter
                      code={output}
                      language={targetFormat === 'csv' ? 'text' : 'sql'}
                      className="min-h-[350px]"
                    />
                  ) : (
                    <div className="min-h-[350px] bg-muted rounded-md p-4 flex items-center justify-center text-muted-foreground">
                      Converted {targetFormat.toUpperCase()} code will appear here...
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      disabled={!output}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleDownload}
                      disabled={!output}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="diff" className="space-y-4">
                  {diffOutput ? (
                    <CodeHighlighter
                      code={diffOutput}
                      language="diff"
                      className="min-h-[350px]"
                    />
                  ) : (
                    <div className="min-h-[350px] bg-muted rounded-md p-4 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Diff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Diff view will show changes between original and converted code</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="report" className="space-y-4">
                  {conversionReport.length > 0 ? (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {conversionReport.map((report, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded border">
                          <Badge variant={report.type === 'warning' ? 'destructive' : 'secondary'}>
                            {report.type === 'warning' ? '⚠' : '✓'}
                          </Badge>
                          <span className="text-sm">{report.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[350px] bg-muted rounded-md p-4 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Conversion report will appear here after processing</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Report */}
        {conversionReport.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Conversion Report</CardTitle>
              <CardDescription>
                Summary of changes made during conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversionReport.map((report, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant={report.type === 'warning' ? 'destructive' : 'secondary'}>
                      {report.type === 'warning' ? '⚠' : '✓'}
                    </Badge>
                    <span className="text-sm">{report.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Queries</CardTitle>
            <CardDescription>
              Try these sample MySQL queries to see the converter in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="table">Table Creation</TabsTrigger>
                <TabsTrigger value="insert">Data Insertion</TabsTrigger>
                <TabsTrigger value="query">Complex Query</TabsTrigger>
              </TabsList>
              <TabsContent value="table" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <pre className="text-sm font-mono whitespace-pre-wrap">
{`CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
                    </pre>
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => setMysqlInput(`CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`)}
                >
                  Use This Sample
                </Button>
              </TabsContent>
              <TabsContent value="insert" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <pre className="text-sm font-mono whitespace-pre-wrap">
{`INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');`}
                    </pre>
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => setMysqlInput(`INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');`)}
                >
                  Use This Sample
                </Button>
              </TabsContent>
              <TabsContent value="query" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <pre className="text-sm font-mono whitespace-pre-wrap">
{`SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name
HAVING order_count > 0
ORDER BY order_count DESC
LIMIT 10;`}
                    </pre>
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => setMysqlInput(`SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name
HAVING order_count > 0
ORDER BY order_count DESC
LIMIT 10;`)}
                >
                  Use This Sample
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Command Palette */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Command Palette</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                if (!isConverting && mysqlInput.trim()) {
                  handleConvert();
                }
                setShowCommandPalette(false);
              }}
              disabled={isConverting || !mysqlInput.trim()}
            >
              <Play className="mr-2 h-4 w-4" />
              Convert SQL (⌘⏎)
            </Button>
            <Button
               variant="ghost"
               className="w-full justify-start"
               onClick={() => {
                 if (output) {
                   navigator.clipboard.writeText(output);
                   toast.success('Copied to clipboard!');
                 }
                 setShowCommandPalette(false);
               }}
               disabled={!output}
             >
               <Copy className="mr-2 h-4 w-4" />
               Copy Result
             </Button>
             <Button
               variant="ghost"
               className="w-full justify-start"
               onClick={() => {
                 if (output) {
                   handleDownload();
                 }
                 setShowCommandPalette(false);
               }}
               disabled={!output}
             >
              <Download className="mr-2 h-4 w-4" />
              Download Result
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Welcome;