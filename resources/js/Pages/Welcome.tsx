import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Copy, Download, Upload, Settings,
  Github, Rocket, Eraser, Activity, Zap, Terminal, Search
} from 'lucide-react';
import { ConversionReport } from '@/lib/sqlConverter';
import { CodeHighlighter } from '@/components/ui/syntax-highlighter';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type TargetFormat = 'postgresql' | 'csv' | 'xlsx' | 'xls' | 'sqlite' | 'psql';

interface ConversionOptions {
  preserveIdentity: boolean;
  handleEnums: 'varchar' | 'check_constraint' | 'enum_table';
  handleSets: 'varchar' | 'array' | 'separate_table';
  timezoneHandling: 'utc' | 'local' | 'preserve';
  triggerHandling: 'convert' | 'comment' | 'skip';
  replaceHandling: 'upsert' | 'insert_ignore' | 'error';
  ignoreHandling: 'on_conflict_ignore' | 'skip' | 'error';
  schemaOnly: boolean;
  csvDelimiter: string;
  csvEnclosure: string;
  csvIncludeHeaders: boolean;
  excelSheetPerTable: boolean;
  excelIncludeMetadata: boolean;
  sqliteForeignKeys: boolean;
  sqliteWalMode: boolean;
}

const Welcome: React.FC = () => {
  const [mysqlInput, setMysqlInput] = useState('');
  const [output, setOutput] = useState('');
  const [diffOutput, setDiffOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionReport, setConversionReport] = useState<ConversionReport[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('postgresql');
  const [activeTab, setActiveTab] = useState('output');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionData, setConversionData] = useState<any>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    preserveIdentity: true,
    handleEnums: 'check_constraint',
    handleSets: 'array',
    timezoneHandling: 'utc',
    triggerHandling: 'convert',
    replaceHandling: 'upsert',
    ignoreHandling: 'on_conflict_ignore',
    schemaOnly: false,
    csvDelimiter: ',',
    csvEnclosure: '"',
    csvIncludeHeaders: true,
    excelSheetPerTable: true,
    excelIncludeMetadata: false,
    sqliteForeignKeys: true,
    sqliteWalMode: true,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isConverting && mysqlInput.trim()) handleConvert();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConverting, mysqlInput]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Frontend validation: 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100MB limit');
      return;
    }

    setIsConverting(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_format', targetFormat);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await axios.post('/convert/upload', formData, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });

      const result = response.data;
      if (!result.success) throw new Error(result.error);
      
      // Also update the input field for visual feedback if it's small enough to display
      if (file.size < 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => setMysqlInput(e.target?.result as string);
        reader.readAsText(file);
      } else {
        setMysqlInput(`-- File ${file.name} uploaded (${(file.size / 1024 / 1024).toFixed(2)} MB)\n-- Content too large to display preview.`);
      }

      processResult(result);
      toast.success(`Converted ${file.name} to ${targetFormat.toUpperCase()}`);
    } catch (err: any) {
      const msg = err.response?.status === 413 ? 'File too large for server (Check php.ini upload_max_filesize)' : (err.response?.data?.error || err.message || 'File conversion failed');
      toast.error(msg);
    } finally {
      setIsConverting(false);
      setUploadProgress(0);
      event.target.value = ''; // Reset input
    }
  };

  const processResult = (result: any) => {
    const data = result.data;
    setConversionData(data);
    
    if (targetFormat === 'xlsx' || targetFormat === 'xls') {
      setOutput(`Excel file generated: ${data.filename}`);
      setConversionReport([{ type: 'info', message: `Excel file ready for download` }]);
    } else if (targetFormat === 'csv') {
      const csvContent = Object.entries(data.files).map(([p, c]) => `-- Table: ${p}\n${c}`).join('\n\n');
      if (csvContent.length > 1024 * 1024) {
        setOutput(`-- Result is too large for editor preview (${(csvContent.length / 1024 / 1024).toFixed(2)} MB)\n-- Please use "Download" for the full content.\n\n` + csvContent.substring(0, 5000) + "\n\n... (rest of file truncated) ...");
        toast.info("Result is large! Editor preview truncated for performance. Please download the full file.");
      } else {
        setOutput(csvContent);
      }
    } else {
      const sql = data.sql || data.script || '';
      if (sql.length > 1024 * 1024) {
        setOutput(`-- Result is too large for editor preview (${(sql.length / 1024 / 1024).toFixed(2)} MB)\n-- Please use "Download" for the full SQL file.\n\n` + sql.substring(0, 5000) + "\n\n... (rest of file truncated) ...");
        toast.info("Result is large! Editor preview truncated for performance. Please download the full file.");
      } else {
        setOutput(sql);
      }
      setDiffOutput(result.diff || '');
      setConversionReport(result.report || []);
    }
  };

  const handleConvert = async () => {
    if (!mysqlInput.trim()) return toast.error('Please enter MySQL code');
    setIsConverting(true);
    try {
      const response = await fetch('/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ mysql_dump: mysqlInput, target_format: targetFormat, options })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      processResult(result);
      toast.success(`Converted to ${targetFormat.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!conversionData) return toast.error('Nothing to download');
    
    // Case 1: Excel format
    if (targetFormat === 'xlsx' || targetFormat === 'xls') {
      window.location.href = `/storage/conversions/${conversionData.filename}`;
      return;
    }

    // Case 2: Full SQL/CSV result
    let content = '';
    if (targetFormat === 'csv') {
      content = Object.entries(conversionData.files || {}).map(([p, c]) => `-- Table: ${p}\n${c}`).join('\n\n');
    } else {
      content = conversionData.sql || conversionData.script || '';
    }

    if (!content) return toast.error('No content to download');

    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration_${targetFormat}_${new Date().getTime()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const clearInput = () => {
    setMysqlInput('');
    toast.info('Input cleared');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full animate-blob animation-delay-2000" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            Converter<span className="text-primary text-2xl">.</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Engine Online</span>
          </div>
          <ThemeToggle />
          <Link href="/support" className="hidden md:block">
            <Button variant="ghost" className="rounded-full font-bold text-xs uppercase tracking-widest px-6 border border-white/5 h-9">Support</Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full">
            <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </nav>

      <main className="container max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Database Transformation Engine
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
            SQL DECODED<span className="text-primary">.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            A premium tool for seamless MySQL migrations. Engineered for speed and precision.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
            <div className="flex items-center glass border px-4 py-1.5 rounded-2xl shadow-2xl">
              <Label className="text-xs font-bold uppercase opacity-40 mr-4 tracking-tighter">Target Format</Label>
              <Select value={targetFormat} onValueChange={(v: any) => setTargetFormat(v)}>
                <SelectTrigger className="w-[160px] bg-transparent border-none text-base font-bold focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="postgresql" className="font-bold">PostgreSQL</SelectItem>
                  <SelectItem value="sqlite" className="font-bold">SQLite</SelectItem>
                  <SelectItem value="csv" className="font-bold">CSV Dump</SelectItem>
                  <SelectItem value="xlsx" className="font-bold">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-2xl px-6 flex border-white/10 hover:bg-white/5 transition-all">
                  <Settings className="w-4 mr-2" />
                  Options
                </Button>
              </SheetTrigger>
              <SheetContent className="glass border-l-white/10 shadow-2xl">
                <SheetHeader className="pb-6 border-b border-white/5">
                  <SheetTitle className="text-2xl font-bold">Conversion Rules</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6">
                  <div className="flex items-center justify-between p-4 glass-card rounded-2xl">
                    <Label className="font-bold">Preserve Identity</Label>
                    <Checkbox checked={options.preserveIdentity} onCheckedChange={(c) => setOptions(p => ({ ...p, preserveIdentity: !!c }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 glass-card rounded-2xl">
                    <Label className="font-bold">Schema Only</Label>
                    <Checkbox checked={options.schemaOnly} onCheckedChange={(c) => setOptions(p => ({ ...p, schemaOnly: !!c }))} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="lg"
              onClick={handleConvert}
              disabled={isConverting || !mysqlInput.trim()}
              className="rounded-2xl px-10 flex bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 font-bold transition-all active:scale-95"
            >
              {isConverting ? <Activity className="animate-spin h-5 w-5 mr-2" /> : <Rocket className="w-5 mr-2" />}
              {isConverting ? 'Processing...' : 'Run Transformation'}
            </Button>
          </div>
        </motion.div>

        {/* Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl group">
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearInput} className="text-[10px] font-black uppercase tracking-tighter opacity-40 hover:opacity-100 flex items-center gap-1">
                    <Eraser className="h-3 w-3" /> Clear
                  </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black tracking-widest text-primary/40 uppercase">Max 100MB</span>
                      <Button variant="ghost" size="sm" onClick={() => document.getElementById('f')?.click()} disabled={isConverting} className="text-[10px] font-black uppercase tracking-tighter opacity-40 hover:opacity-100 flex items-center gap-1">
                        {isConverting ? <Activity className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
                      </Button>
                      <input id="f" type="file" accept=".sql" className="hidden" onChange={handleFileUpload} disabled={isConverting} />
                    </div>
                  </div>
                </div>
                
                {/* Upload Progress Bar */}
                <AnimatePresence>
                  {isConverting && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-8 pb-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                          {uploadProgress < 100 ? 'Uploading...' : 'Processing Engine...'}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                          {uploadProgress}%
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-1 bg-primary/5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              <Textarea
                value={mysqlInput}
                onChange={(e) => setMysqlInput(e.target.value)}
                placeholder="-- Paste MySQL here..."
                className="min-h-[500px] p-8 bg-transparent border-none focus-visible:ring-0 font-mono text-base resize-none leading-relaxed"
              />
            </Card>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between gap-4">
                  <TabsList className="bg-white/5 rounded-full p-1 ring-1 ring-white/10">
                    <TabsTrigger value="output" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary">Output</TabsTrigger>
                    <TabsTrigger value="diff" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary">Diff</TabsTrigger>
                    <TabsTrigger value="report" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary">Log</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!output} className="h-9 w-9 rounded-xl hover:bg-white/5"><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!output} className="h-9 w-9 rounded-xl hover:bg-white/5"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="flex-1 min-h-[440px]">
                  <AnimatePresence mode="wait">
                    <TabsContent key={activeTab} value={activeTab} className="m-0 p-0 h-full">
                      {activeTab === 'output' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          {output ? (
                            <div className="h-[500px] overflow-auto">
                              <CodeHighlighter code={output} language={targetFormat === 'csv' ? 'text' : 'sql'} />
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center">
                              <Terminal className="h-16 w-16 mb-4" />
                              <p className="font-bold text-sm uppercase tracking-[0.2em]">Awaiting Execution</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'diff' && (
                        <div className="p-8 font-mono text-xs opacity-50 italic flex flex-col items-center justify-center h-full gap-4">
                          <Search className="h-12 w-12 opacity-20" />
                          {diffOutput || 'No structural delta detected.'}
                        </div>
                      )}

                      {activeTab === 'report' && (
                        <div className="p-8 space-y-3">
                          {conversionReport.length > 0 ? conversionReport.map((r, i) => (
                            <div key={i} className={`p-4 rounded-2xl glass border-l-4 font-bold text-xs ${r.type === 'error' ? 'border-red-500' : 'border-primary'}`}>
                              <span className="opacity-40 mr-2">[{r.type.toUpperCase()}]</span> {r.message}
                            </div>
                          )) : (
                            <div className="opacity-20 text-center p-20 flex flex-col items-center justify-center h-full gap-4">
                              <Activity className="h-12 w-12 opacity-20" />
                              <p className="uppercase tracking-widest font-bold text-xs italic">Clear path. No issues.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </AnimatePresence>
                </div>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 flex items-center justify-between opacity-30 text-xs font-bold uppercase tracking-widest">
          <div>© 2026 Converter Tooling System</div>
          <div className="flex gap-8">
            <Link href="/docs" className="hover:text-primary transition-colors">Docs</Link>
            <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
            <Link href="/status" className="hover:text-primary transition-colors">Status</Link>
            <Link href="/support#donation" className="hover:text-primary transition-colors text-amber-500/80">Donate</Link>
          </div>
        </footer>
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Welcome;
