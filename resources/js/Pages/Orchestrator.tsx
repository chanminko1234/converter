import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    Activity, Zap,
    ArrowRight, ShieldCheck,
    TrendingUp, Table, RefreshCcw,
    AlertTriangle, PlayCircle
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';


const Orchestrator: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const [sourceDb, setSourceDb] = useState(params.get('source') || '');
    const [targetDb, setTargetDb] = useState(params.get('target') || '');
    const [isLive, setIsLive] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [tables, setTables] = useState<any[]>([]);
    const [throughputHistory, setThroughputHistory] = useState<any[]>([]);
    const [isCuttingOver, setIsCuttingOver] = useState(false);

    const [isSimulating, setIsSimulating] = useState(false);

    const fetchStatus = useCallback(async () => {
        if (isSimulating) {
            setMetrics((prev: any) => ({
                total_rows_migrated: (prev?.total_rows_migrated ?? 0) + Math.floor(Math.random() * 500),
                avg_throughput_eps: 250 + Math.floor(Math.random() * 100),
                active_streams: 4,
                completed_tables: 12,
                total_tables: 24,
                progress_pct: Math.min(100, (prev?.progress_pct ?? 0) + 0.5),
                is_live: true
            }));
            setTables(prev => prev.length ? prev : Array.from({ length: 8 }, (_, i) => ({
                id: i,
                table_name: `table_${i + 1}`,
                rows_synced: 5000,
                last_throughput: 200,
                sync_status: i < 3 ? 'syncing' : 'completed'
            })));
            setThroughputHistory(prev => {
                const next = [...prev, {
                    time: new Date().toLocaleTimeString().split(' ')[0],
                    val: 250 + Math.floor(Math.random() * 100)
                }];
                return next.slice(-20);
            });
            return;
        }

        if (!sourceDb || !targetDb) return;

        try {
            const response = await axios.post('/convert/migration-status', {
                source_db: sourceDb,
                target_db: targetDb
            });

            if (response.data.success) {
                const newData = response.data.data;
                setMetrics(newData.metrics);
                setTables(newData.tables);
                setIsLive(newData.metrics.is_live);

                // Update chart history
                setThroughputHistory(prev => {
                    const next = [...prev, {
                        time: new Date().toLocaleTimeString().split(' ')[0],
                        val: newData.metrics.avg_throughput_eps
                    }];
                    return next.slice(-20); // Keep last 20 points
                });
            }
        } catch (err) {
            console.error('Status fetch failed', err);
        }
    }, [sourceDb, targetDb, isSimulating]);

    useEffect(() => {
        let interval: any;
        if (isLive) {
            interval = setInterval(fetchStatus, 2000);
        } else {
            fetchStatus();
        }
        return () => clearInterval(interval);
    }, [isLive, fetchStatus]);

    const handleCutover = async () => {
        setIsCuttingOver(true);
        try {
            const response = await axios.post('/convert/cutover', {
                source_db: sourceDb,
                target_db: targetDb
            });
            if (response.data.success) {
                toast.success('Cutover successful! Target is now Primary.');
                fetchStatus();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cutover failed');
        } finally {
            setIsCuttingOver(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
            <Head>
                <title>Zero-Downtime Orchestrator | SQL STREAM</title>
            </Head>

            {/* Background Canvas */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[140px] rounded-full" />
            </div>

            <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link href="/" className="bg-primary/20 p-2.5 rounded-xl ring-1 ring-primary/30">
                        <Zap className="h-6 w-6 text-primary fill-primary/20" />
                    </Link>
                    <div className="flex flex-col text-white">
                        <span className="font-black text-xl tracking-tighter leading-none">
                            SQL<span className="text-primary italic">STREAM</span>
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Mission Control v4.0</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-4">
                        <Link href="/validation" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Validation</Link>
                        <Link href="/orchestrator" className="text-[10px] font-black uppercase tracking-widest text-primary">Orchestrator</Link>
                        <Link href="/status" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Health</Link>
                    </div>
                    <ThemeToggle />
                    <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9 text-white">Advanced</Button>
                </div>
            </nav>

            <main className="container max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest"
                        >
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Production Migration Active
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Zero-Downtime<br />Orchestrator<span className="text-primary italic">.</span></h1>
                    </div>

                    <div className="flex gap-4 p-4 glass-card rounded-3xl border-white/5 shadow-2xl">
                        <div className="space-y-1 px-4 border-r border-white/5">
                            <label className="text-[8px] font-black uppercase tracking-widest opacity-40">Source</label>
                            <input
                                className="bg-transparent border-none text-white focus:ring-0 p-0 text-sm font-bold w-32"
                                placeholder="DB Name"
                                value={sourceDb}
                                onChange={e => setSourceDb(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1 px-4">
                            <label className="text-[8px] font-black uppercase tracking-widest opacity-40">Target</label>
                            <input
                                className="bg-transparent border-none text-white focus:ring-0 p-0 text-sm font-bold w-32"
                                placeholder="DB Name"
                                value={targetDb}
                                onChange={e => setTargetDb(e.target.value)}
                            />
                        </div>
                        <Button
                            className={`rounded-2xl ${isSimulating ? 'bg-primary flex text-white shadow-lg shadow-primary/40' : 'flex bg-white/5 text-white'}`}
                            onClick={() => {
                                setIsSimulating(!isSimulating);
                                if (!isSimulating) {
                                    setIsLive(true);
                                    toast.info('Simulation Engine Engaged');
                                }
                            }}
                        >
                            <PlayCircle className="w-4 mr-2" />
                            {isSimulating ? 'Stop Simulation' : 'Simulate'}
                        </Button>
                        <Button
                            className="rounded-2xl bg-white/5 hover:bg-white/10 text-white"
                            size="icon"
                            onClick={() => fetchStatus()}
                        >
                            <RefreshCcw className={`h-4 w-4 ${(isLive || isSimulating) ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Hero Impact Metrics */}
                    <Card className="glass-card rounded-[2.5rem] border-white/5 p-8 relative overflow-hidden group">
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center ring-1 ring-primary/40">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest opacity-40">Performance</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black tracking-tighter text-white">{metrics?.avg_throughput_eps ?? 0}</span>
                                <span className="text-xs font-black uppercase tracking-widest opacity-40">Rows/s</span>
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground pt-4">Mean average across all active streams.</p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-24 opacity-20 group-hover:opacity-40 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={throughputHistory}>
                                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#3b82f6" strokeWidth={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="glass-card rounded-[2.5rem] border-white/5 p-8 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center ring-1 ring-emerald-500/40">
                                <Activity className="h-5 w-5 text-emerald-500" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest opacity-40">Aggregate Data</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-4xl font-black tracking-tighter text-white">
                                        {metrics?.total_rows_migrated?.toLocaleString() ?? 0}
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Records Synced</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-white">{metrics?.progress_pct ?? 0}%</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Completed</p>
                                </div>
                            </div>
                            <Progress value={metrics?.progress_pct ?? 0} className="h-3 bg-white/5" />
                        </div>
                    </Card>

                    <Card className="glass-card rounded-[2.5rem] border-white/5 p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/40">
                                <ShieldCheck className="h-5 w-5 text-amber-500" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest opacity-40">Operational Status</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                                <span className="opacity-40 font-bold">Active Streams</span>
                                <span className="text-white font-black">{metrics?.active_streams ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                                <span className="opacity-40 font-bold">Tables Pending</span>
                                <span className="text-white font-black">{(metrics?.total_tables ?? 0) - (metrics?.completed_tables ?? 0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2">
                                <span className="opacity-40 font-bold">Latency</span>
                                <span className="text-emerald-500 font-black flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    Sub-second
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Live Throughput Chart */}
                    <div className="lg:col-span-8">
                        <Card className="h-full glass-card rounded-[3rem] border-white/5 p-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black tracking-tighter text-white">Network Fabric</h3>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-40">Live Real-Time Flow Analysis</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="rounded-full px-4 border-white/10 text-white/40">Live Feed</Badge>
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={throughputHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="time"
                                            fontSize={10}
                                            tick={{ fill: 'rgba(255,255,255,0.2)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            fontSize={10}
                                            tick={{ fill: 'rgba(255,255,255,0.2)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="val"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={false}
                                            animationDuration={1000}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Table Stream Monitor */}
                    <div className="lg:col-span-4">
                        <Card className="h-full glass-card rounded-[3rem] border-white/5 overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                                <h3 className="text-xl font-black tracking-tighter text-white">Stream Sharding</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Table-Level Observability</p>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[480px] p-2 custom-scrollbar">
                                <div className="space-y-1">
                                    {tables.map((table, i) => (
                                        <motion.div
                                            key={table.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Table className="h-4 w-4 opacity-40" />
                                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{table.table_name}</span>
                                                </div>
                                                <Badge className={`rounded-lg px-2 py-0 text-[8px] font-black tracking-widest uppercase ${table.sync_status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    table.sync_status === 'syncing' ? 'bg-primary/10 text-primary animate-pulse' :
                                                        'bg-white/5 text-white/40'
                                                    }`}>
                                                    {table.sync_status}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                                                    <span>{table.rows_synced.toLocaleString()} Rows</span>
                                                    <span>{Math.round(table.last_throughput)} EPS</span>
                                                </div>
                                                {table.sync_status === 'syncing' && (
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-primary"
                                                            animate={{ x: [-100, 100] }}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {tables.length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center opacity-20 grayscale">
                                            <AlertTriangle className="h-8 w-8 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">No Active Streams</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <AnimatePresence>
                    {metrics?.progress_pct >= 100 && (
                        <motion.footer
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-12 left-0 w-full z-40 px-4"
                        >
                            <div className="max-w-4xl mx-auto p-1 bg-gradient-to-r from-emerald-500/30 via-primary/20 to-emerald-500/30 rounded-[3rem] shadow-2xl">
                                <div className="p-10 rounded-[2.8rem] bg-background/80 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center ring-1 ring-emerald-500/40 shadow-inner">
                                            <ShieldCheck className="text-emerald-500 h-8 w-8" />
                                        </div>
                                        <div className="text-left space-y-1">
                                            <h3 className="text-2xl font-black tracking-tighter text-white">Full Parity Achieved</h3>
                                            <p className="text-xs text-muted-foreground font-medium">All database nodes are in a state of transactional consistency. System is ready for final cutover.</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCutover}
                                        disabled={isCuttingOver}
                                        className="group relative rounded-2xl px-12 py-8 font-black uppercase tracking-[0.2em] text-[10px] overflow-hidden transition-all bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/40"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <span className="relative flex items-center gap-3 text-white">
                                            {isCuttingOver ? 'Executing Cutover...' : 'Final Enterprise Cutover'}
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </motion.footer>
                    )}
                </AnimatePresence>
            </main>

            <style>{`
                .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); }
                .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px); }
                .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Orchestrator;
