import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Upload, Play, FileText } from 'lucide-react';
import { MySQLToPostgreSQLConverter, ConversionReport } from '@/lib/sqlConverter';
import { CodeHighlighter } from '@/components/ui/syntax-highlighter';
import { ThemeToggle } from '@/components/theme-toggle';

const Welcome: React.FC = () => {
  const [mysqlInput, setMysqlInput] = useState('');
  const [postgresOutput, setPostgresOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionReport, setConversionReport] = useState<ConversionReport[]>([]);
  const [error, setError] = useState<string>('');
  const [converter] = useState(() => new MySQLToPostgreSQLConverter());

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
    if (!postgresOutput.trim()) return;
    
    const blob = new Blob([postgresOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_postgresql.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (!mysqlInput.trim()) {
      setError('Please enter some MySQL code to convert');
      return;
    }
    
    setIsConverting(true);
    setError('');
    setConversionReport([]);
    
    // Simulate processing time
    setTimeout(() => {
      try {
        const result = converter.convert(mysqlInput);
        
        if (!result.convertedSql.trim()) {
          setError('Conversion failed: No output generated');
          setIsConverting(false);
          return;
        }
        
        setPostgresOutput(result.convertedSql);
        setConversionReport(result.reports);
      } catch (err) {
        setError(`Conversion failed: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        setPostgresOutput('');
        setConversionReport([]);
      } finally {
        setIsConverting(false);
      }
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postgresOutput);
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

        {/* Main Converter Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* MySQL Input */}
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
                  className="min-h-[300px] font-mono text-sm"
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

          {/* PostgreSQL Output */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PostgreSQL Output
              </CardTitle>
              <CardDescription>
                Converted PostgreSQL code will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {postgresOutput ? (
                  <CodeHighlighter
                    code={postgresOutput}
                    language="sql"
                    className="min-h-[300px]"
                  />
                ) : (
                  <div className="min-h-[300px] bg-muted rounded-md p-4 flex items-center justify-center text-muted-foreground">
                    Converted PostgreSQL code will appear here...
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    disabled={!postgresOutput}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={handleDownload}
                    disabled={!postgresOutput}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
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
    </div>
  );
};

export default Welcome;