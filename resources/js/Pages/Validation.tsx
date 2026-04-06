import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    ShieldCheck, Zap, Server, Activity,
    Database, RefreshCcw, CheckCircle2, XCircle,
    Loader2, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const Validation: React.FC = () => {
    const [sourceConn, setSourceConn] = useState({ host: 'localhost', port: '3306', user: '', pass: '', db: '' });
    const [targetConn, setTargetConn] = useState({ host: 'localhost', port: '5432', user: '', pass: '', db: '' });
    const [sourceType, setSourceType] = useState('mysql');
    const [isValidating, setIsValidating] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleValidate = async () => {
        if (!sourceConn.db || !targetConn.db) {
            toast.error('Both Source and Target database details are required.');
            return;
        }

        setIsValidating(true);
        setResults(null);

        try {
            const response = await axios.post('/convert/validate', {
                source: sourceConn,
                source_type: sourceType,
                target: targetConn
            });

            if (response.data.success) {
                setResults(response.data.data);
                toast.success('Integrity validation completed.');
            } else {
                throw new Error(response.data.error);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Validation failed');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
            <Head>
                <title>Data Integrity Validator | SQL STREAM</title>
                <meta name="description" content="Verify data integrity between your source and target databases. Check row counts and data checksums to ensure perfect migration." />
            </Head>

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            </div>

            <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link href="/" className="bg-primary/20 p-2.5 rounded-xl ring-1 ring-primary/30">
                        <Zap className="h-6 w-6 text-primary fill-primary/20" />
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-black text-xl tracking-tighter leading-none text-white whitespace-nowrap">
                            SQL<span className="text-primary italic">STREAM</span>
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Integrity Labs</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-4">
                        <Link href="/status" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Status</Link>
                        <Link href="/docs" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Docs</Link>
                        <Link href="/validation" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Validation</Link>
                        <Link href="/index-advisor" className="text-[10px] font-black uppercase tracking-widest text-primary">Index Advisor</Link>
                    </div>
                    <ThemeToggle />
                    <Link href="/support">
                        <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9 text-white hover:bg-white/5 hover:text-white">Concierge</Button>
                    </Link>
                </div>
            </nav>

            <main className="container max-w-6xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <section className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-xl"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Trust Protocol v1.4
                    </motion.div>
                    <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">Integrity<br />Audit System<span className="text-primary italic">.</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Verify row counts and sample checksums between source and target nodes with cryptographic precision.</p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Setup Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="glass-card rounded-[2.5rem] border-white/10 p-8 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                                <Server className="h-10 w-24" />
                            </div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Database className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-black tracking-tight text-white">Source Protocol</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Engine Typology</Label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceType}
                                        onChange={(e) => setSourceType(e.target.value)}
                                    >
                                        <option value="mysql">MySQL Engine</option>
                                        <option value="oracle">Oracle Database</option>
                                        <option value="sqlserver">SQL Server (MSSQL)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Host</Label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                            value={sourceConn.host}
                                            onChange={e => setSourceConn({ ...sourceConn, host: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Port</Label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                            value={sourceConn.port}
                                            onChange={e => setSourceConn({ ...sourceConn, port: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Identity (User)</Label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceConn.user}
                                        onChange={e => setSourceConn({ ...sourceConn, user: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Namespace (DB)</Label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceConn.db}
                                        onChange={e => setSourceConn({ ...sourceConn, db: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="glass-card rounded-[2.5rem] border-white/10 p-8 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                                <ShieldCheck className="h-10 w-24" />
                            </div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                    <RefreshCcw className="h-5 w-5 text-indigo-400" />
                                </div>
                                <h2 className="text-lg font-black tracking-tight text-white">Target Node (PG)</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Host</Label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-indigo-500 transition-all outline-none"
                                            value={targetConn.host}
                                            onChange={e => setTargetConn({ ...targetConn, host: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Port</Label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-indigo-500 transition-all outline-none"
                                            value={targetConn.port}
                                            onChange={e => setTargetConn({ ...targetConn, port: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Identity (User)</Label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-indigo-500 transition-all outline-none"
                                        value={targetConn.user}
                                        onChange={e => setTargetConn({ ...targetConn, user: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Namespace (DB)</Label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-indigo-500 transition-all outline-none"
                                        value={targetConn.db}
                                        onChange={e => setTargetConn({ ...targetConn, db: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Button
                            className="w-full h-16 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            onClick={handleValidate}
                            disabled={isValidating}
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Synchronizing Nodes...
                                </>
                            ) : (
                                <>
                                    <Search className="h-5 w-5" />
                                    Initiate Integrity Audit
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-7">
                        <Card className="glass-card rounded-[2.5rem] border-white/10 min-h-[600px] shadow-2xl relative overflow-hidden flex flex-col">
                            {!results && !isValidating && (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                                    <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10">
                                        <Activity className="h-10 w-10 opacity-20" />
                                    </div>
                                    <div className="space-y-2 text-white">
                                        <h3 className="text-2xl font-black tracking-tight">Audit Standby</h3>
                                        <p className="text-muted-foreground text-sm font-medium">Please provide connection parameters to begin the data parity verification sequence.</p>
                                    </div>
                                </div>
                            )}

                            {isValidating && (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
                                    <div className="relative">
                                        <div className="h-32 w-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black tracking-tight text-white">Scanning Parity...</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60 justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                            Reading Large Objects
                                        </div>
                                    </div>
                                </div>
                            )}

                            {results && (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="p-10 border-b border-white/5 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black tracking-tight text-white">Audit Report</h3>
                                            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">Discard Analysis</Link>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center">
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 text-emerald-500">Verified</p>
                                                <p className="text-3xl font-black text-emerald-500 leading-none">{results.summary.passed}</p>
                                            </div>
                                            <div className="p-6 bg-red-500/10 rounded-3xl border border-red-500/20 text-center">
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 text-red-500">Diverged</p>
                                                <p className="text-3xl font-black text-red-500 leading-none">{results.summary.failed}</p>
                                            </div>
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 text-white">Total Objects</p>
                                                <p className="text-3xl font-black text-white leading-none">{results.summary.total_tables}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                        <div className="space-y-4">
                                            {results.results.map((r: any, i: number) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${r.status === 'passed' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                                {r.status === 'passed' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-sm tracking-tight text-white mb-1">{r.table}</h4>
                                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${r.status === 'passed' ? 'text-emerald-500' : 'text-red-500'}`}>{r.message}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4 items-center">
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Source / Target</p>
                                                                <p className="font-mono text-[10px] font-black text-white/60">
                                                                    <span className={r.source_count !== r.target_count ? 'text-red-400' : ''}>{r.source_count}</span>
                                                                    <span className="mx-2 opacity-20">/</span>
                                                                    <span>{r.target_count}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

            <style>{`
                .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); }
                .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px); }
                .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
};

export default Validation;
