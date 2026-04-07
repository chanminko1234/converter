import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    MessageCircle, HelpCircle, Send, Github, ExternalLink, 
    Zap, Rocket, Shield, Cpu, Activity, Info, LifeBuoy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Support() {
    const faqs = [
        { q: "What is the maximum throughput for live streaming?", a: "Our edge cluster nodes support up to 50,000 transactions per second (TPS) with the Zero-Downtime Sync Worker." },
        { q: "Does the mission control support Oracle and SQL Server?", a: "Yes. The Mission Control Orchestrator provides real-time telemetry and parity auditing for all supported source engines, including MySQL, Oracle, and MSSQL." },
        { q: "Is PII masking applied on-the-fly during streaming?", a: "Yes. All data stream buffers are intercepted by the Staging Synthesis layer to apply FakerPHP-based obfuscation before reaching the target sink." },
        { q: "How do I perform a final cutover?", a: "Navigate to the Orchestrator cockpit. Once data parity reaches 100%, hit the 'Final Enterprise Cutover' button to atomize the transition and switch your application's primary connection." },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                        Engineering Support Hub
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        Clearance Hub
                    </h2>
                </div>
            }
        >
            <Head title="Engineering Support" />

            <div className="py-6 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-24">
                {/* Support Hero Section */}
                <section className="space-y-6 max-w-3xl">
                    <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none text-foreground uppercase italic px-1">
                        Priority <span className="text-primary italic">Clearance.</span>
                    </h1>
                    <p className="text-xl text-foreground/40 font-bold leading-relaxed tracking-tight">
                        Navigating a high-uptime database migration? Our architects and global community are here to provide deep-tier technical guidance for the SQL STREAM protocol.
                    </p>
                </section>

                {/* Support Platforms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: <MessageCircle />, title: 'Dev Cluster', desc: 'Real-time peer reviews and help from 3,000+ engineers.', action: 'Join Discord', color: 'text-indigo-500' },
                        { icon: <Github />, title: 'Core Issues', desc: 'Contribute to the transpiler logic and report structural bugs.', action: 'Open Tracker', color: 'text-foreground/60' },
                        { icon: <Shield />, title: 'Architecture SLA', desc: 'On-demand migration consulting for mission-critical nodes.', action: 'Contact Sales', color: 'text-primary' },
                    ].map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="glass-card rounded-[3.1rem] p-12 border-foreground/5 dark:border-white/5 hover:border-primary/20 transition-all flex flex-col items-center text-center gap-8 group shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                    {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-32 w-32" })}
                                </div>
                                <div className={`p-6 bg-foreground/5 dark:bg-white/5 rounded-[2.1rem] group-hover:bg-primary/10 transition-colors shadow-inner ring-1 ring-white/5 ${item.color}`}>
                                    {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-8 w-8" })}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-black text-2xl tracking-tighter uppercase italic text-foreground leading-none">{item.title}</h3>
                                    <p className="text-[10px] text-foreground/30 uppercase font-black tracking-widest px-4">{item.desc}</p>
                                </div>
                                <Button variant="outline" className="w-full flex items-center justify-center rounded-2xl border-foreground/10 dark:border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-foreground/5 dark:hover:bg-white/10 h-14 mt-4 text-foreground/60 group-hover:text-foreground group-hover:border-primary/20 transition-all">
                                    {item.action}
                                    <ExternalLink className="h-3 w-3 ml-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Innovation Fund Section */}
                <section id="sponsorship" className="scroll-mt-32">
                    <Card className="bg-slate-900/60 rounded-[4.5rem] p-16 border border-white/5 relative overflow-hidden shadow-2xl group shadow-inner">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[160px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:translate-x-1/3 transition-all duration-1000" />
                        
                        <div className="flex flex-col lg:flex-row items-center gap-24 relative z-10">
                            <div className="flex-1 space-y-10">
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-6 py-2 rounded-full text-[10px] uppercase font-black tracking-[0.2em] shadow-glow-amber">
                                    Sustain the Innovation
                                </Badge>
                                <h2 className="text-6xl font-black tracking-tighter leading-none italic uppercase text-foreground">Sustain <br />The <span className="text-amber-500">Stream.</span></h2>
                                <p className="text-xl text-foreground/40 font-bold leading-relaxed tracking-tight max-w-xl">
                                    SQL STREAM is an open-source movement. Your sponsorship directly funds the development of the Neural Engine and maintains our global low-latency stream nodes.
                                </p>
                                <div className="flex flex-wrap gap-6 pt-4">
                                    <Button className="rounded-3xl px-14 h-18 bg-amber-500 hover:bg-amber-600 font-black uppercase text-[11px] tracking-widest text-black shadow-[0_20px_60px_rgba(245,158,11,0.3)] transition-all active:scale-95 ring-1 ring-white/20">
                                        Github Sponsors
                                    </Button>
                                    <Button variant="outline" className="rounded-3xl px-14 h-18 border-white/10 font-black uppercase text-[11px] tracking-widest hover:bg-white/5 transition-all active:scale-95 text-foreground/70 hover:text-foreground">
                                        Become a Partner
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full lg:w-[450px] grid grid-cols-2 gap-8">
                                {[
                                    { label: 'Edge Nodes', val: 'Global', icon: <Activity /> },
                                    { label: 'Neural Logic', val: 'Active', icon: <Cpu /> },
                                    { label: 'Payload Hub', val: 'AES-256', icon: <Shield /> },
                                    { label: 'Sponsors', val: 'Join Node', icon: <Zap /> },
                                ].map((stat, i) => (
                                    <Card key={i} className="p-10 rounded-[3rem] bg-foreground/[0.02] border-foreground/5 dark:border-white/5 space-y-6 hover:bg-foreground/[0.04] transition-all group shadow-sm">
                                        <div className="text-amber-500/40 group-hover:text-amber-500 transition-colors shadow-glow-amber-small">
                                            {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { className: "h-6 w-6" })}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">{stat.label}</p>
                                            <p className="font-black text-2xl tracking-tighter text-foreground uppercase italic">{stat.val}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </Card>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                    {/* Technical FAQ */}
                    <section className="space-y-12">
                        <div className="flex items-center gap-6 px-1">
                            <div className="p-4 bg-primary/10 rounded-[1.8rem] shadow-xl ring-1 ring-primary/20">
                                <HelpCircle className="text-primary h-8 w-8 shadow-glow-primary" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-foreground leading-none">Technical FAQ</h2>
                        </div>
                        <div className="space-y-6">
                            {faqs.map((f, i) => (
                                <motion.div key={i} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Card className="glass-card border-foreground/5 dark:border-white/5 p-10 rounded-[3rem] hover:border-primary/20 transition-all shadow-xl group">
                                        <h4 className="font-black text-lg mb-4 tracking-tighter group-hover:text-primary transition-colors text-foreground uppercase italic leading-tight">{f.q}</h4>
                                        <p className="text-[11px] text-foreground/40 leading-relaxed font-bold tracking-tight">{f.a}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Engineering Ticket */}
                    <section className="space-y-12">
                        <div className="flex items-center gap-6 px-1">
                            <div className="p-4 bg-emerald-500/10 rounded-[1.8rem] shadow-xl ring-1 ring-emerald-500/20">
                                <Send className="text-emerald-500 h-8 w-8 shadow-glow-emerald" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-foreground leading-none">Terminal Ticket</h2>
                        </div>
                        <Card className="glass-card border-foreground/5 dark:border-white/5 rounded-[4rem] p-14 relative overflow-hidden shadow-2xl group shadow-inner">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                <LifeBuoy className="h-64 w-64 text-emerald-500" />
                            </div>
                            <div className="space-y-10 relative z-10">
                                <div className="space-y-2">
                                    <h4 className="font-black text-3xl tracking-tighter text-foreground uppercase italic leading-none">Launch Inquiry</h4>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">Architectural Oversight Tier 1</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="h-16 bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/10 rounded-2xl px-8 flex items-center text-[11px] font-black uppercase tracking-widest text-foreground/20 italic group-hover:text-foreground/40 transition-colors">Namespace ID / Node Host</div>
                                    <div className="h-16 bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/10 rounded-2xl px-8 flex items-center text-[11px] font-black uppercase tracking-widest text-foreground/20 italic group-hover:text-foreground/40 transition-colors">Engineering Contact Entity</div>
                                    <div className="h-52 bg-foreground/[0.02] dark:bg-white/[0.02] border border-foreground/5 dark:border-white/10 rounded-[2.5rem] p-8 text-[11px] font-black uppercase tracking-widest text-foreground/20 italic leading-relaxed group-hover:text-foreground/40 transition-colors">Describe the structural complexity of your legacy patterns...</div>
                                </div>
                                <Button className="w-full rounded-3xl h-20 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[12px] tracking-[0.4em] shadow-[0_20px_60px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-black ring-1 ring-white/20">
                                    Launch Request
                                </Button>
                            </div>
                        </Card>
                    </section>
                </div>

                <footer className="pt-20 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-8 text-foreground/20">
                    <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4" />
                        <div className="h-px w-8 bg-foreground/10" />
                        <Shield className="h-4 w-4" />
                         <div className="h-px w-8 bg-foreground/10" />
                        <LifeBuoy className="h-4 w-4" />
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.4em]">© 2026 SQL STREAM INFRASTRUCTURE • GLOBAL CLEARANCE HUB </div>
                </footer>
            </div>

            <style>{`
                .glass-card { background: rgba(var(--background), 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
                .shadow-glow-amber { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); }
                .shadow-glow-amber-small { filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.2)); }
                .shadow-glow-primary { filter: drop-shadow(0 0 12px rgba(var(--primary), 0.4)); }
                .shadow-glow-emerald { filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.4)); }
            `}</style>
        </AuthenticatedLayout>
    );
}
