import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { Badge } from '@/Components/ui/badge';
import { Activity, Zap, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TableStat {
    id: number;
    table_name: string;
    rows_synced: number;
    last_throughput: number;
    sync_status: 'idle' | 'syncing' | 'completed' | 'error';
    last_synced_at: string;
}

interface LiveDashboardProps {
    sourceDb: string;
    targetDb: string;
    isSyncing: boolean;
    onCompleted?: () => void;
}

export const LiveMigrationDashboard: React.FC<LiveDashboardProps> = ({ sourceDb, targetDb, isSyncing, onCompleted }) => {
    const [stats, setStats] = useState<TableStat[]>([]);
    const [history, setHistory] = useState<number[]>(new Array(30).fill(0));
    const timerRef = useRef<any>(null);

    const fetchStats = async () => {
        try {
            const response = await axios.post('/convert/status', {
                source_db: sourceDb,
                target_db: targetDb
            });
            if (response.data.success) {
                const newStats = response.data.stats;
                setStats(newStats);
                
                // Update throughput history for the mini-chart
                const totalThroughput = newStats.reduce((acc: number, s: TableStat) => acc + (s.sync_status === 'syncing' ? s.last_throughput : 0), 0);
                setHistory(prev => [...prev.slice(1), totalThroughput]);

                // Check if all tables are completed
                const allDone = newStats.length > 0 && newStats.every((s: TableStat) => s.sync_status === 'completed');
                if (allDone && isSyncing) {
                    onCompleted?.();
                    clearInterval(timerRef.current);
                }
            }
        } catch (err) {
            console.error('Failed to fetch migration stats', err);
        }
    };

    useEffect(() => {
        if (isSyncing) {
            timerRef.current = setInterval(fetchStats, 1000);
            return () => clearInterval(timerRef.current);
        }
    }, [isSyncing, sourceDb, targetDb]);

    const totalSynced = stats.reduce((acc, s) => acc + s.rows_synced, 0);
    const avgThroughput = history[history.length - 1];

    return (
        <div className="space-y-8 p-1">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-slate-950/40 border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-primary" />
                    </div>
                    <div className="space-y-2 relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Current Throughput</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-4xl font-black tracking-tighter text-white tabular-nums">{avgThroughput.toFixed(0)}</h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1.5">Rows/Sec</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-slate-950/40 border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="space-y-2 relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Migrated</p>
                        <div className="flex items-end gap-3">
                            <h3 className="text-4xl font-black tracking-tighter text-white tabular-nums">{totalSynced.toLocaleString()}</h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1.5">Records</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-slate-950/40 border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="space-y-2 relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Sync Status</p>
                        <div className="flex items-center gap-3 h-11">
                            <Badge variant={isSyncing ? 'default' : 'outline'} className={`px-4 py-1 rounded-full font-black uppercase text-[10px] tracking-widest ${isSyncing ? 'bg-primary animate-pulse shadow-lg shadow-primary/40' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                {isSyncing ? 'Synchronizing' : 'Idle / Standby'}
                            </Badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Table Progress List */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Active Table Pipeline</h4>
                <div className="grid gap-4">
                    <AnimatePresence>
                        {stats.map((table) => (
                            <motion.div
                                key={table.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass border border-white/5 p-6 rounded-[2rem] flex items-center gap-6 group hover:bg-white/[0.04] transition-all"
                            >
                                <div className={`p-4 rounded-2xl ${table.sync_status === 'completed' ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                                    {table.sync_status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Activity className="w-5 h-5 text-primary animate-pulse" />}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black tracking-tight text-white">{table.table_name}</span>
                                            <Badge variant="outline" className={`text-[8px] font-black tracking-widest uppercase py-0.5 ${table.sync_status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                {table.sync_status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black tabular-nums">{table.rows_synced.toLocaleString()}</span>
                                                <span className="text-[8px] font-black uppercase opacity-30 mt-0.5">Rows Moved</span>
                                            </div>
                                            <div className="w-[1px] h-6 bg-white/5" />
                                            <div className="flex flex-col items-end min-w-[80px]">
                                                <span className="text-[10px] font-black text-primary tabular-nums">+{table.last_throughput.toFixed(0)}</span>
                                                <span className="text-[8px] font-black uppercase opacity-30 mt-0.5">Sync Rate</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Progress value={table.sync_status === 'completed' ? 100 : 45} className="h-1.5 bg-white/5" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
