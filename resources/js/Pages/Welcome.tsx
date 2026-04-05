import React, { useState, useEffect } from 'react';
import { Link, Head } from '@inertiajs/react';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Copy, Download, Upload, Settings,
  Github, Rocket, Eraser, Activity, Zap, Terminal, Search,
  Database, Server, Maximize2
} from 'lucide-react';
import { ConversionReport } from '@/lib/sqlConverter';
import { CodeHighlighter } from '@/components/ui/syntax-highlighter';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ERDVisualizer } from '@/components/ERDVisualizer';
import { DiffExplorer } from '@/components/DiffExplorer';

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
  predictiveRefactoring: boolean;
  autoCleaning: boolean;
  incrementalSync: boolean;
  dataMasking: boolean;
  frameworkPreset: 'none' | 'wordpress' | 'laravel' | 'magento';
}

const Welcome: React.FC = () => {
  const [mysqlInput, setMysqlInput] = useState('');
  const [output, setOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionReport, setConversionReport] = useState<ConversionReport[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('postgresql');
  const [activeTab, setActiveTab] = useState('output');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversionData, setConversionData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [schemaData, setSchemaData] = useState<any[] | null>(null);
  const [isFullScreenERD, setIsFullScreenERD] = useState(false);
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
    predictiveRefactoring: true,
    autoCleaning: true,
    incrementalSync: false,
    dataMasking: false,
    frameworkPreset: 'none',
  });
  const [mode, setMode] = useState<'sql' | 'stream'>('sql');
  const [sourceConn, setSourceConn] = useState({ host: 'localhost', port: '3306', user: '', pass: '', db: '' });
  const [targetConn, setTargetConn] = useState({ host: 'localhost', port: '5432', user: '', pass: '', db: '' });

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
    if (data.schema_meta) {
      setSchemaData(data.schema_meta);
    }

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
      setConversionReport(result.report || []);
    }
  };

  const handleAnalyze = async () => {
    if (mode === 'sql' && !mysqlInput.trim()) return toast.error('Please enter MySQL code to analyze');
    if (mode === 'stream' && !sourceConn.db) return toast.error('Please provide source database details');

    setIsAnalyzing(true);
    try {
      const payload = mode === 'sql'
        ? { mysql_dump: mysqlInput, options }
        : { source: sourceConn, options };

      const response = await fetch('/convert/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setSchemaData(result.data.tables);
      setActiveTab('visualization');
      toast.success('Interactive ERD generated');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (mode === 'sql' && !mysqlInput.trim()) return toast.error('Please enter MySQL code');
    if (mode === 'stream' && (!sourceConn.db || !targetConn.db)) return toast.error('Please provide database details');

    setIsConverting(true);
    try {
      const endpoint = mode === 'sql' ? '/convert' : '/convert/stream';
      const payload = mode === 'sql'
        ? { mysql_dump: mysqlInput, target_format: targetFormat, options }
        : { source: sourceConn, target: targetConn, options };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      processResult(result);
      toast.success(mode === 'sql' ? `Converted to ${targetFormat.toUpperCase()}` : 'Live Migration Completed');
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
      <Head>
        <title>MySQL to PostgreSQL Converter | Free SQL Transpiler</title>
        <meta name="description" content="Automate your database migration with SQL STREAM. The ultimate robust MySQL to PostgreSQL converter. Features data masking, Laravel/WordPress presets, and multi-format export." />
        <meta name="keywords" content="mysql to postgresql, database converter, sql migration tool, automate mysql migration, postgres transpiler, mysql to csv export, free sql tools" />
      </Head>
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary/25 blur-[160px] rounded-full animate-blob mix-blend-screen overflow-hidden" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 blur-[160px] rounded-full animate-blob animation-delay-2000 mix-blend-screen overflow-hidden" />
        <div className="absolute top-[30%] left-[60%] w-[40%] h-[40%] bg-pink-500/15 blur-[140px] rounded-full animate-blob animation-delay-4000 mix-blend-screen overflow-hidden" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between backdrop-blur-3xl shadow-2xl shadow-black/10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="bg-primary/20 p-3 rounded-2xl ring-1 ring-primary/40 group-hover:bg-primary/30 transition-all duration-700 shadow-lg shadow-primary/20">
            <Rocket className="h-7 w-7 text-primary fill-primary/30 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter leading-none bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              SQL<span className="text-primary italic">STREAM</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70 mt-1">High Performance Migration</span>
          </div>
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
          className="text-center mb-24 space-y-6"
        >
          <Badge variant="outline" className="px-5 py-1.5 rounded-full border-primary/30 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-[0_0_20px_rgba(109,40,217,0.3)] border-2">
            Engineering Preview v2.0
          </Badge>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none text-white overflow-visible">
            Migrate <span className="text-primary italic">Better.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed font-sans">
            The ultimate bridge from MySQL to PostgreSQL. Engineering speed,
            <span className="text-white font-bold mx-1 inline-flex items-center gap-1 group cursor-help transition-all hover:text-primary">
              Predictive AI <Zap className="inline-block w-4 h-4 text-primary fill-primary group-hover:scale-125 transition-transform" />
            </span>, and real-time streaming built for
            high-availability systems.
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <div className="bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-white/10 flex gap-2 backdrop-blur-xl shadow-inner shadow-black/20">
              <Button
                variant={mode === 'sql' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('sql')}
                className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest"
              >
                <Terminal className="w-3 h-3 mr-2" />
                SQL Dump
              </Button>
              <Button
                variant={mode === 'stream' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('stream')}
                className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest"
              >
                <Server className="w-3 h-3 mr-2" />
                Live Stream
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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
              <SheetContent className="glass border-l-white/10 shadow-2xl overflow-y-auto custom-scrollbar">
                <SheetHeader className="pb-6 border-b border-white/5">
                  <SheetTitle className="text-2xl font-bold">Conversion Rules</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-6 overflow-x-hidden">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Framework Optimization</Label>
                    <Select 
                      value={options.frameworkPreset} 
                      onValueChange={(v: any) => setOptions(p => ({ ...p, frameworkPreset: v }))}
                    >
                      <SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl focus:ring-primary h-12">
                        <SelectValue placeholder="Select Framework" />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/10 text-white rounded-xl overflow-hidden shadow-2xl">
                         <SelectItem value="none" className="hover:bg-white/5 focus:bg-white/5 transition-colors py-3">General (Standard SQL)</SelectItem>
                         <SelectItem value="wordpress" className="hover:bg-white/5 focus:bg-white/5 transition-colors py-3 font-medium">WordPress Presets</SelectItem>
                         <SelectItem value="laravel" className="hover:bg-white/5 focus:bg-white/5 transition-colors py-3 font-medium text-amber-500">Laravel Optimization</SelectItem>
                         <SelectItem value="magento" className="hover:bg-white/5 focus:bg-white/5 transition-colors py-3 font-medium text-orange-500">Magento Ecosystem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card rounded-2xl">
                    <Label className="font-bold">Preserve Identity</Label>
                    <Checkbox checked={options.preserveIdentity} onCheckedChange={(c) => setOptions(p => ({ ...p, preserveIdentity: !!c }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 glass-card rounded-2xl">
                    <Label className="font-bold">Schema Only</Label>
                    <Checkbox checked={options.schemaOnly} onCheckedChange={(c) => setOptions(p => ({ ...p, schemaOnly: !!c }))} />
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 rounded-[2rem] border border-primary/20 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-12 h-12 text-primary" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/20 p-2.5 rounded-xl mt-1">
                        <Zap className="h-4 w-4 text-primary fill-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-xs uppercase tracking-widest text-primary">Predictive Refactoring</h3>
                          <Badge variant="outline" className="text-[8px] bg-primary/20 border-primary/40 text-primary font-black uppercase tracking-tighter">AI Enabled</Badge>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-60">Uses advanced heuristics to suggest modern PostgreSQL types (e.g., VARCHAR(255) → TEXT, TIMESTAMPTZ).</p>
                        <div className="pt-2 flex items-center justify-end">
                          <Checkbox
                            id="predictive-refactoring"
                            checked={options.predictiveRefactoring}
                            onCheckedChange={(c) => setOptions(p => ({ ...p, predictiveRefactoring: !!c }))}
                            className="bg-primary/10 border-primary/20 data-[state=checked]:bg-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-[2rem] border border-amber-500/20 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Eraser className="w-12 h-12 text-amber-500" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-500/20 p-2.5 rounded-xl mt-1">
                        <Eraser className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-xs uppercase tracking-widest text-amber-500">Auto-Cleaning</h3>
                          <Badge variant="outline" className="text-[8px] bg-amber-500/20 border-amber-500/40 text-amber-500 font-black uppercase tracking-tighter">Optimization</Badge>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-60">Detects inconsistent naming conventions and redundant structural patterns.</p>
                        <div className="pt-2 flex items-center justify-end">
                          <Checkbox
                            id="auto-cleaning"
                            checked={options.autoCleaning}
                            onCheckedChange={(c) => setOptions(p => ({ ...p, autoCleaning: !!c }))}
                            className="bg-amber-500/10 border-amber-500/20 data-[state=checked]:bg-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-6 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-[2rem] border border-green-500/20 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Terminal className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-green-500/20 p-2.5 rounded-xl mt-1">
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-xs uppercase tracking-widest text-green-500">Incremental Sync</h3>
                          <Badge variant="outline" className="text-[8px] bg-green-500/20 border-green-500/40 text-green-500 font-black uppercase tracking-tighter">Zero Downtime</Badge>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-60">Tracks the high-water mark of your data to only migrate records changed or added since the last run.</p>
                        <div className="pt-2 flex items-center justify-end">
                          <Checkbox
                            id="incremental-sync"
                            checked={options.incrementalSync}
                            onCheckedChange={(c) => setOptions(p => ({ ...p, incrementalSync: !!c }))}
                            className="bg-green-500/10 border-green-500/20 data-[state=checked]:bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-6 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-indigo-500/10 rounded-[2rem] border border-blue-500/20 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Search className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-500/20 p-2.5 rounded-xl mt-1">
                        <Maximize2 className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-xs uppercase tracking-widest text-blue-500">Data Masking (PII)</h3>
                          <Badge variant="outline" className="text-[8px] bg-blue-500/20 border-blue-500/40 text-blue-500 font-black uppercase tracking-tighter">Privacy Mode</Badge>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed opacity-60">Automatically obfuscates sensitive data like emails and phone numbers for staging environments.</p>
                        <div className="pt-2 flex items-center justify-end">
                          <Checkbox
                            id="data-masking"
                            checked={options.dataMasking}
                            onCheckedChange={(c) => setOptions(p => ({ ...p, dataMasking: !!c }))}
                            className="bg-blue-500/10 border-blue-500/20 data-[state=checked]:bg-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="lg"
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing || isConverting || (mode === 'sql' && !mysqlInput.trim()) || (mode === 'stream' && !sourceConn.db)}
              className="rounded-2xl flex px-8 border-primary/20 hover:bg-primary/5 text-primary font-bold shadow-xl transition-all active:scale-95"
            >
              {isAnalyzing ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 w-4" />}
              Analyze Schema
            </Button>

            <Button
              size="lg"
              onClick={handleConvert}
              disabled={isConverting || (mode === 'sql' && !mysqlInput.trim()) || (mode === 'stream' && (!sourceConn.db || !targetConn.db))}
              className={`rounded-2xl px-10 flex shadow-2xl font-bold transition-all active:scale-95 ${mode === 'stream' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/40' : 'bg-primary hover:bg-primary/90 shadow-primary/40'
                }`}
            >
              {isConverting ? <Activity className="animate-spin h-5 w-5 mr-2" /> : mode === 'stream' ? <Server className="w-5 mr-2" /> : <Rocket className="w-5 mr-2" />}
              {isConverting ? 'Processing...' : mode === 'stream' ? 'Start Live Stream' : 'Run Transformation'}
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
            <Card className="glass-card rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl group min-h-[500px] flex flex-col">
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                </div>
                {mode === 'sql' && (
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
                )}
                {mode === 'stream' && (
                  <Badge variant="outline" className="text-[8px] border-primary/40 text-primary font-black uppercase tracking-tighter">Direct Streaming</Badge>
                )}
              </div>

              {/* Context Switch */}
              <div className="flex-1 overflow-auto">
                {mode === 'sql' ? (
                  <>
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
                  </>
                ) : (
                  <div className="p-10 space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-xl">
                          <Database className="w-4 h-4 text-amber-500" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest opacity-60">Source: MySQL</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Host</Label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={sourceConn.host}
                            onChange={e => setSourceConn(p => ({ ...p, host: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Port</Label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={sourceConn.port}
                            onChange={e => setSourceConn(p => ({ ...p, port: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Username</Label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={sourceConn.user}
                            onChange={e => setSourceConn(p => ({ ...p, user: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</Label>
                          <input
                            type="password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={sourceConn.pass}
                            password-autofill="false"
                            onChange={e => setSourceConn(p => ({ ...p, pass: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Database Name</Label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                          value={sourceConn.db}
                          onChange={e => setSourceConn(p => ({ ...p, db: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                          <Database className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest opacity-60">Target: PostgreSQL</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Host</Label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={targetConn.host}
                            onChange={e => setTargetConn(p => ({ ...p, host: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Port</Label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={targetConn.port}
                            onChange={e => setTargetConn(p => ({ ...p, port: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Username</Label>
                          <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={targetConn.user}
                            onChange={e => setTargetConn(p => ({ ...p, user: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</Label>
                          <input
                            type="password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                            value={targetConn.pass}
                            password-autofill="false"
                            onChange={e => setTargetConn(p => ({ ...p, pass: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Database Name</Label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-primary/40 outline-none"
                          value={targetConn.db}
                          onChange={e => setTargetConn(p => ({ ...p, db: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                    <TabsTrigger value="visualization" className="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-indigo-500">ERD</TabsTrigger>
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

                      {activeTab === 'visualization' && (
                        <div className="p-4 h-[500px] relative group/erd rounded-3xl overflow-hidden border border-white/5 bg-slate-950/40">
                          {schemaData ? (
                            <>
                              <ERDVisualizer tables={schemaData} />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsFullScreenERD(true)}
                                className="absolute top-6 right-6 opacity-0 group-hover/erd:opacity-100 transition-all bg-slate-900/40 backdrop-blur-md border-white/10 rounded-xl hover:bg-primary/20 hover:scale-110"
                              >
                                <Maximize2 className="h-4 w-4 text-primary" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-20 p-20 text-center h-full gap-4">
                              <Search className="h-16 w-16 mb-4" />
                              <p className="font-bold text-sm uppercase tracking-[0.2em]">Click Analyze to generate ERD</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'diff' && (
                        <div className="h-[500px] p-2">
                           <DiffExplorer oldCode={mysqlInput} newCode={output} />
                        </div>
                      )}

                      {activeTab === 'report' && (
                        <div className="p-8 space-y-3">
                          {conversionReport.length > 0 ? conversionReport.map((r, i) => {
                            const isAi = r.message.includes('AI Suggestion:');
                            const isCleaning = r.message.includes('Auto-Cleaning:');
                            return (
                              <div key={i} className={`p-4 rounded-2xl glass border-l-4 font-bold text-xs ${r.type === 'error' ? 'border-red-500 bg-red-500/5' :
                                isAi ? 'border-primary bg-primary/5' :
                                  isCleaning ? 'border-amber-500 bg-amber-500/5' :
                                    'border-primary/40 bg-white/5'
                                } transition-all hover:scale-[1.02] duration-300`}>
                                <div className="flex items-start gap-3">
                                  {isAi && (
                                    <div className="bg-primary/20 p-1.5 rounded-lg">
                                      <Zap className="h-3 w-3 text-primary fill-primary" />
                                    </div>
                                  )}
                                  {isCleaning && (
                                    <div className="bg-amber-500/20 p-1.5 rounded-lg">
                                      <Eraser className="h-3 w-3 text-amber-500 fill-amber-500" />
                                    </div>
                                  )}
                                  <div>
                                    <span className={`opacity-40 mr-2 ${isAi ? 'text-primary' : isCleaning ? 'text-amber-500' : ''}`}>[{isAi ? 'GEMINI' : isCleaning ? 'CLEANUP' : r.type.toUpperCase()}]</span>
                                    <span className={isAi || isCleaning ? 'text-foreground/90' : 'opacity-80'}>
                                      {r.message.replace('AI Suggestion: ', '').replace('Auto-Cleaning: ', '')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }) : (
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
      <Dialog open={isFullScreenERD} onOpenChange={setIsFullScreenERD}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 border-none bg-slate-950/90 backdrop-blur-3xl overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(var(--primary),0.1)] focus:outline-none">
          {schemaData && (
            <div className="h-full w-full relative group">
              <ERDVisualizer tables={schemaData} />
              <div className="absolute top-12 left-12 pointer-events-none space-y-4">
                <div className="flex items-center gap-6">
                  <div className="bg-indigo-600 p-4 rounded-[2rem] shadow-2xl shadow-indigo-600/40">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">Architectural View</h2>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Schema Mapping Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Welcome;
