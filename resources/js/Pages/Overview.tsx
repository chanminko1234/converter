import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Cpu, Shield, Activity, Database, CheckCircle2, 
    ArrowRight, Rocket, Layers, Zap, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Overview() {
    const pillars = [
        {
            title: 'Neural Fidelity',
            desc: 'Moving beyond mapping to intelligent transpilation. Our Predictive AI engine adapts to complex legacy patterns automatically.',
            icon: <Cpu className="h-6 w-6 text-primary" />
        },
        {
            title: 'Staging Defense',
            desc: 'PII masking via FakerPHP ensures your non-production environments remain functional yet 100% compliant and secure.',
            icon: <Shield className="h-6 w-6 text-emerald-400" />
        },
        {
            title: 'Mission Control',
            desc: 'Zero-downtime orchestration with real-time telemetry. Monitor throughput, parity, and perform final cutovers.',
            icon: <Activity className="h-6 w-6 text-amber-500" />
        },
        {
            title: 'Identity Federation',
            desc: 'Secure architectural access via GitHub and Google SSO. Integrated RBAC ensures only cleared nodes can access the core.',
            icon: <Shield className="h-6 w-6 text-primary" />
        }
    ];

    const ecosystem = [
        {
            title: 'Migration Protocol',
            steps: [
                'Audit: Predictive AI scans for legacy structural anti-patterns.',
                'Stream: Execute direct node-to-node data synchronization.',
                'Validate: Automated integrity checks with O(1) performance.',
                'Protect: Generation of atomic, idempotent rollback engines.'
            ]
        },
        {
            title: 'The Edge Strategy',
            steps: [
                'Stateless Core: Processing happens in-memory with zero data retention.',
                'Framework Presets: Context-aware logic for Laravel, WP, and Magento.',
                'Delta Sync: Incremental migration for high-uptime environments.'
            ]
        }
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                        Technical Specification
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        System Ecosystem
                    </h2>
                </div>
            }
        >
            <Head title="System Overview" />

            <div className="py-6 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-24">
                {/* Hero Section */}
                <section className="space-y-8">
                    <div className="max-w-3xl space-y-6">
                        <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] text-foreground uppercase italic">
                            The Future of <span className="text-primary italic">Data Evolution.</span>
                        </h1>
                        <p className="text-lg text-foreground/40 font-bold leading-relaxed tracking-tight">
                            SQL STREAM isn't just a converter; it's a stateful migration ecosystem designed to bridge the gap between legacy MySQL, Oracle, and SQL Server instances and resilient, modern PostgreSQL architectures.
                        </p>
                    </div>
                </section>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="glass-card p-10 border-foreground/5 dark:border-white/5 rounded-[2.5rem] hover:border-primary/20 transition-all group h-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                    {React.isValidElement(p.icon) && React.cloneElement(p.icon as React.ReactElement<any>, { className: "w-32 h-32" })}
                                </div>
                                <div className="p-4 bg-foreground/5 dark:bg-white/5 rounded-2xl w-fit mb-8 group-hover:bg-primary/10 transition-colors">
                                    {p.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight text-foreground uppercase italic">{p.title}</h3>
                                <p className="text-sm text-foreground/40 leading-relaxed font-bold">{p.desc}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Ecosystem Details */}
                    <div className="space-y-16">
                        {ecosystem.map((g, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4 px-2">
                                    <div className="h-8 w-1.5 bg-primary rounded-full transition-transform hover:scale-y-110" />
                                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground">{g.title}</h2>
                                </div>
                                <div className="space-y-3">
                                    {g.steps.map((step, idx) => (
                                        <div key={idx} className="flex gap-6 p-6 rounded-3xl bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/5 hover:bg-foreground/[0.04] transition-all group shadow-sm">
                                            <div className="text-primary font-black text-[10px] pt-1 opacity-20 group-hover:opacity-100 transition-opacity tracking-widest">0{idx + 1}</div>
                                            <p className="text-sm font-bold text-foreground/60 group-hover:text-foreground transition-colors tracking-tight">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Integrated Roadmap Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="relative overflow-hidden bg-slate-900/40 dark:bg-slate-900/60 rounded-[3.5rem] border-foreground/5 dark:border-white/5 p-12 min-h-[600px] flex flex-col justify-center gap-10 group shadow-inner">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                                <Database className="h-72 w-72 text-primary" />
                            </div>
                            
                            <div className="space-y-10 relative z-10">
                                <div className="space-y-3">
                                    <h3 className="text-5xl font-black tracking-tighter uppercase italic text-primary leading-none">Engineering Roadmap</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">Active Infrastructure Cycles</p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { icon: <Activity />, text: "Real-time SSE Result Streaming", active: true },
                                        { icon: <Database />, text: "Unified Multi-DB Strategy Pattern", active: true },
                                        { icon: <CheckCircle2 />, text: "Zero-Downtime Incremental Sync", active: true },
                                        { icon: <Cpu />, text: "AI-Powered Gemini Index Advisor", active: true },
                                        { icon: <Shield />, text: "GitHub & Google SSO Federation", active: true },
                                        { icon: <Layers />, text: "Postgres, MySQL, SQLite, Oracle, MSSQL", active: true },
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-center gap-5 ${item.active ? 'opacity-100' : 'opacity-20'}`}>
                                            <div className={`p-3 rounded-2xl ${item.active ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-foreground/5 text-foreground'}`}>
                                                {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                                            </div>
                                            <span className="font-black text-sm tracking-tight text-foreground uppercase">{item.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6">
                                    <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer">
                                        <Button className="w-fit flex items-center rounded-2xl px-12 h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_20px_60px_rgba(var(--primary),0.25)] ring-1 ring-white/10">
                                            Contribute to Core <Rocket className="h-4 w-4 ml-3 group-hover:rotate-12 transition-transform" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .glass-card { background: rgba(var(--background), 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
            `}</style>
        </AuthenticatedLayout>
    );
}
