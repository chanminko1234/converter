import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import {
    Activity, Zap, ArrowRight, ShieldCheck, TrendingUp,
    Table, RefreshCcw, AlertTriangle, PlayCircle, Clock,
    Cpu, Globe, Settings, Database, Terminal
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

export default function Orchestrator() {
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
            setTables(prev => prev.length ? prev : Array.from({ length: 12 }, (_, i) => ({
                id: i,
                table_name: `node_registry_${(i + 1).toString().padStart(2, '0')}`,
                rows_synced: 15400 + (i * 200),
                last_throughput: 180 + (i * 10),
                sync_status: i < 4 ? 'syncing' : 'completed'
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

                setThroughputHistory(prev => {
                    const next = [...prev, {
                        time: new Date().toLocaleTimeString().split(' ')[0],
                        val: newData.metrics.avg_throughput_eps
                    }];
                    return next.slice(-20);
                });
            }
        } catch (err) {
            console.error('Status fetch failed', err);
        }
    }, [sourceDb, targetDb, isSimulating]);

    useEffect(() => {
        let interval: any;
        if (isLive || isSimulating) {
            interval = setInterval(fetchStatus, 2000);
        } else {
            fetchStatus();
        }
        return () => clearInterval(interval);
    }, [isLive, isSimulating, fetchStatus]);

    const handleCutover = async () => {
        setIsCuttingOver(true);
        try {
            const response = await axios.post('/convert/cutover', {
                source_db: sourceDb,
                target_db: targetDb
            });
            if (response.data.success) {
                toast.success('Enterprise cutover successful! Sink is now Primary.');
                fetchStatus();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cutover failed');
        } finally {
            setIsCuttingOver(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] shadow-glow-emerald">
                            Mission Control Active
                        </Badge>
                        <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                            Global Orchestration Node
                        </Badge>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        Fabric Cockpit
                    </h2>
                </div>
            }
        >
            <Head title="Orchestrator Cockpit" />

            <div className="py-6 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-32">
                {/* Header Controls */}
                <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                    <div className="space-y-6">
                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none text-foreground uppercase italic px-1">
                            Mission <span className="text-primary italic">Orchestrator.</span>
                        </h1>
                        <p className="text-xl text-foreground/40 font-bold leading-relaxed tracking-tight max-w-2xl">
                            Real-time structural synchronization and transactional sharding across the global database fabric. Zero-artifact performance guaranteed.
                        </p>
                    </div>

                    <Card className="p-2 pt-3 pl-3 glass-card rounded-[3.5rem] border-foreground/5 dark:border-white/5 flex flex-wrap xl:flex-nowrap items-center gap-2 shadow-2xl ring-1 ring-white/5">
                        <div className="flex items-center bg-foreground/[0.02] border border-foreground/5 rounded-[2.8rem] px-8 py-3 gap-8">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 leading-none">Source Registry</label>
                                <input
                                    className="bg-transparent border-none text-foreground focus:ring-0 p-0 text-[13px] font-black uppercase tracking-tight w-24 italic placeholder:text-foreground/10"
                                    placeholder="DB_ALPHA"
                                    value={sourceDb}
                                    onChange={e => setSourceDb(e.target.value)}
                                />
                            </div>
                            <div className="h-8 w-px bg-foreground/5" />
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 leading-none">Target Sink</label>
                                <input
                                    className="bg-transparent border-none text-foreground focus:ring-0 p-0 text-[13px] font-black uppercase tracking-tight w-24 italic placeholder:text-foreground/10"
                                    placeholder="DB_OMEGA"
                                    value={targetDb}
                                    onChange={e => setTargetDb(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex p-1 bg-foreground/[0.02] border border-foreground/5 rounded-[2.8rem] gap-1">
                            <Button
                                className={`rounded-full flex px-8 font-black uppercase text-[10px] tracking-widest transition-all ${isSimulating ? 'bg-primary text-black shadow-glow-primary' : 'bg-transparent text-foreground/40 hover:bg-foreground/5 hover:text-foreground'}`}
                                onClick={() => {
                                    setIsSimulating(!isSimulating);
                                    if (!isSimulating) {
                                        setIsLive(true);
                                        toast.info('Simulation Matrix Initialized');
                                    }
                                }}
                            >
                                <PlayCircle className="w-4 mr-3" />
                                {isSimulating ? 'Offline Simulator' : 'Engage Matrix'}
                            </Button>
                            <Button
                                variant="ghost"
                                className="rounded-full h-14 w-14 p-0 text-foreground/30 hover:text-primary transition-all active:rotate-180 duration-500"
                                onClick={() => fetchStatus()}
                            >
                                <RefreshCcw className={`h-5 w-5 ${(isLive || isSimulating) ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </Card>
                </header>

                {/* Primary Telemetry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <Card className="glass-card rounded-[3.5rem] border-foreground/5 p-10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">
                            <TrendingUp className="h-32 w-32 text-primary" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 ring-1 ring-primary/20">
                                    <Activity className="h-6 w-6 text-primary shadow-glow-primary" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">Throughput Metric</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-7xl font-black tracking-tighter text-foreground leading-none italic">{metrics?.avg_throughput_eps ?? 0}</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-primary italic">Ops/s</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 pt-6">Active Shard Throughput Analysis</p>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-32 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={throughputHistory}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="glass-card rounded-[3.5rem] border-foreground/5 p-10 relative overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/10 ring-1 ring-emerald-500/20">
                                <Globe className="h-6 w-6 text-emerald-500 shadow-glow-emerald" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">Cluster Aggregation</span>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <span className="text-5xl font-black tracking-tighter text-foreground leading-none italic">
                                        {(metrics?.total_rows_migrated ?? 0).toLocaleString()}
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 leading-none">Global Sync Packets</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="text-2xl font-black text-foreground italic">{metrics?.progress_pct ?? 0}%</span>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20 leading-none">Sync Score</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Progress value={metrics?.progress_pct ?? 0} className="h-2 bg-foreground/5 overflow-hidden rounded-full shadow-inner" />
                            </div>
                        </div>
                    </Card>

                    <Card className="glass-card rounded-[3.5rem] border-foreground/5 p-10 flex flex-col justify-between shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/10 ring-1 ring-amber-500/20">
                                <ShieldCheck className="h-6 w-6 text-amber-500 shadow-glow-amber" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">Operational Integrity</span>
                        </div>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between text-[11px] font-black py-4 border-b border-foreground/5 uppercase tracking-widest">
                                <span className="text-foreground/20 italic">Primary Streams</span>
                                <span className="text-foreground">{metrics?.active_streams ?? 0} Units</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-black py-4 border-b border-foreground/5 uppercase tracking-widest">
                                <span className="text-foreground/20 italic">Shards Unlinked</span>
                                <span className="text-red-500">{(metrics?.total_tables ?? 0) - (metrics?.completed_tables ?? 0)} Objects</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-black py-4 uppercase tracking-widest">
                                <span className="text-foreground/20 italic">Node Latency</span>
                                <span className="text-emerald-500 flex items-center gap-2">
                                    <Zap className="h-3 w-3" />
                                    Sub-Critical
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Live Throughput Chart */}
                    <div className="lg:col-span-8">
                        <Card className="h-full glass-card rounded-[4rem] border-foreground/5 p-12 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <Terminal className="h-32 w-32 text-primary" />
                            </div>
                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none">Network Fabric</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">High-Frequency Operational Analysis</p>
                                </div>
                                <div className="flex gap-3">
                                    <Badge variant="outline" className="rounded-full px-5 py-1.5 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 text-[9px] font-black uppercase tracking-widest shadow-glow-emerald">Active Feed</Badge>
                                </div>
                            </div>
                            <div className="h-[450px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={throughputHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--foreground), 0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="time"
                                            fontSize={9}
                                            tick={{ fill: 'hsla(var(--foreground), 0.2)', fontWeight: 900 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            fontSize={9}
                                            tick={{ fill: 'hsla(var(--foreground), 0.2)', fontWeight: 900 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(0,0,0,0.9)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '24px',
                                                padding: '16px'
                                            }}
                                            labelStyle={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}
                                            itemStyle={{ color: '#3b82f6', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="val"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            dot={false}
                                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#000' }}
                                            animationDuration={1000}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Table Stream Monitor */}
                    <div className="lg:col-span-4">
                        <Card className="h-full glass-card rounded-[4rem] border-foreground/5 overflow-hidden shadow-2xl flex flex-col group">
                            <div className="p-10 border-b border-foreground/5 bg-foreground/[0.01] flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black tracking-tighter uppercase italic text-foreground leading-none">Stream Shards</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">Node Observability</p>
                                </div>
                                <div className="h-10 w-10 bg-foreground/5 rounded-2xl flex items-center justify-center border border-foreground/5">
                                    <Settings className="h-5 w-5 text-foreground/20 group-hover:rotate-90 transition-transform duration-500" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[580px] p-4 custom-scrollbar space-y-3">
                                {tables.map((table, i) => (
                                    <motion.div
                                        key={table.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-8 rounded-[2.8rem] hover:bg-foreground/[0.02] border border-transparent hover:border-foreground/5 transition-all group/item relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="h-10 w-10 bg-foreground/5 rounded-xl flex items-center justify-center border border-foreground/5">
                                                    <Table className="h-4 w-4 text-foreground/20 group-hover/item:text-primary transition-colors" />
                                                </div>
                                                <span className="text-[13px] font-black uppercase tracking-tighter text-foreground italic group-hover/item:text-primary transition-colors">{table.table_name}</span>
                                            </div>
                                            <Badge className={`rounded-xl px-4 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-sm ${table.sync_status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                table.sync_status === 'syncing' ? 'bg-primary/10 text-primary animate-pulse' :
                                                    'bg-foreground/5 text-foreground/20'
                                                }`}>
                                                {table.sync_status}
                                            </Badge>
                                        </div>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">
                                                <span className="flex items-center gap-2">
                                                    <Database className="h-3 w-3" />
                                                    {table.rows_synced.toLocaleString()} Packets
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    {Math.round(table.last_throughput)} EPS
                                                </span>
                                            </div>
                                            {table.sync_status === 'syncing' && (
                                                <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                                                    <motion.div
                                                        className="h-full bg-primary shadow-glow-primary"
                                                        animate={{ x: ['-100%', '100%'] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {tables.length === 0 && (
                                    <div className="h-60 flex flex-col items-center justify-center opacity-10 space-y-6">
                                        <AlertTriangle className="h-16 w-16" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Fabric Standby</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Mission Finalization Footer */}
                <AnimatePresence>
                    {metrics?.progress_pct >= 100 && (
                        <motion.footer
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="fixed bottom-12 left-0 w-full z-50 px-6"
                        >
                            <div className="max-w-4xl mx-auto p-1.5 bg-gradient-to-r from-emerald-500/40 via-primary/30 to-emerald-500/40 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                                <div className="p-12 rounded-[3.8rem] bg-background/90 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-10 border border-white/10 ring-1 ring-white/5">
                                    <div className="flex items-center gap-8">
                                        <div className="h-20 w-20 bg-emerald-500/20 rounded-[2.2rem] flex items-center justify-center ring-1 ring-emerald-500/40 shadow-glow-emerald">
                                            <ShieldCheck className="text-emerald-500 h-10 w-10 shadow-glow-emerald" />
                                        </div>
                                        <div className="text-left space-y-2">
                                            <h3 className="text-4xl font-black tracking-tighter uppercase italic text-foreground leading-none">Full Parity Achieved</h3>
                                            <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-widest max-w-sm">All sharded nodes are transactionally consistent. System is cleared for final enterprise cutover.</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCutover}
                                        disabled={isCuttingOver}
                                        className="group relative rounded-3xl px-14 h-24 bg-emerald-500 hover:bg-emerald-600 shadow-[0_20px_60px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-black font-black uppercase text-[12px] tracking-[0.4em] ring-1 ring-white/20"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <span className="relative flex items-center gap-5">
                                            {isCuttingOver ? 'Executing Node Atomic Cutover...' : 'Final Enterprise Cutover'}
                                            <ArrowRight className="h-6 w-6" />
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </motion.footer>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .glass-card { background: rgba(var(--background), 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
                .shadow-glow-emerald { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4)); }
                .shadow-glow-primary { filter: drop-shadow(0 0 12px rgba(var(--primary), 0.4)); }
                .shadow-glow-amber { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.4)); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsla(var(--foreground), 0.05); border-radius: 10px; }
            `}</style>
        </AuthenticatedLayout>
    );
}
