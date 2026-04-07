import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Zap, Activity, ShieldCheck, 
    ArrowUpRight, Clock, Server, Layers,
    TrendingUp, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
    const stats = [
        { label: 'Migration Streams', value: '12 Active', icon: <Zap className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'System Throughput', value: '850 MB/s', icon: <Activity className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Database Integrity', value: '100% Parity', icon: <ShieldCheck className="h-4 w-4" />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Active Infrastructure', value: '24 Nodes', icon: <Server className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    const logs = [
        { id: 1, event: 'Identity Verification Success', node: 'Node-771', time: '2m ago', status: 'secure' },
        { id: 2, event: 'Schema Transpilation Complete', node: 'Node-102', time: '15m ago', status: 'secure' },
        { id: 3, event: 'High Memory Delta Detected', node: 'Node-095', time: '1h ago', status: 'warning' },
        { id: 4, event: 'Binary Log Replication Active', node: 'Node-112', time: '3h ago', status: 'secure' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                            Infrastructure Overview
                        </Badge>
                        <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic px-1">
                            Node Control Center
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-foreground/10 hover:bg-foreground/5 bg-background/50 backdrop-blur-xl transition-all">
                            Export Telemetry
                        </Button>
                        <Link href="/orchestrator">
                            <Button className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                Launch Sync
                            </Button>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Control Center" />

            <div className="py-6 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="glass-card p-6 border-foreground/5 dark:border-white/5 rounded-[2rem] hover:border-primary/20 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { className: "w-24 h-24" })}
                                </div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
                                        <TrendingUp className="w-3 h-3" />
                                    </div>
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">{stat.label}</h3>
                                <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                Operational Telemetry
                            </h3>
                            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary">View Full Log</Button>
                        </div>
                        <Card className="glass-card border-foreground/5 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="divide-y divide-foreground/5">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${log.status === 'secure' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {log.status === 'secure' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">{log.event}</h4>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">{log.node} • Primary Engine</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="text-[9px] font-black opacity-40 group-hover:opacity-100 flex items-center gap-1.5 border-none bg-transparent">
                                                <Clock className="w-3 h-3" />
                                                {log.time}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Quick Access */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80 flex items-center gap-2 px-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Fast Response
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { title: 'Orchestrator', desc: 'Manage binary log sync', color: 'bg-primary' },
                                { title: 'Validation', desc: 'Run integrity parity check', color: 'bg-indigo-500' },
                                { title: 'Index Advisor', desc: 'Optimize query throughput', color: 'bg-emerald-500' },
                                { title: 'System Docs', desc: 'Review node protocols', color: 'bg-slate-700' },
                            ].map((item, i) => (
                                <Card key={i} className="glass-card p-6 border-foreground/5 dark:border-white/5 rounded-[2rem] hover:bg-foreground/[0.03] transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${item.color}/10 flex items-center justify-center text-foreground`}>
                                            <ArrowUpRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                                    <p className="text-[10px] font-bold text-foreground/40">{item.desc}</p>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .glass-card { background: rgba(var(--background), 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
            `}</style>
        </AuthenticatedLayout>
    );
}
