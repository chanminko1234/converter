import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Zap, Server, Database, MessageSquare, Terminal, 
    Maximize2, Loader2, Sparkles, Info, ChevronRight,
    Cpu, Activity, Shield, Rocket, Copy, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { CodeHighlighter } from '@/Components/ui/syntax-highlighter';

export default function IndexAdvisor() {
    const [sourceConn, setSourceConn] = useState({ host: 'localhost', port: '3306', user: '', pass: '', db: '' });
    const [sourceType, setSourceType] = useState('mysql');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    const handleAdvise = async () => {
        if (!sourceConn.db && !isSimulating) {
            toast.error('Source node parameters are required for analysis.');
            return;
        }

        setIsAnalyzing(true);
        setRecommendations([]);

        if (isSimulating) {
            setTimeout(() => {
                setRecommendations([
                    {
                        table: 'user_activity_logs',
                        suggestions: [
                            {
                                type: 'BRIN INDEX',
                                columns: ['created_at'],
                                reason: 'This table appears to be a time-series log with over 50M rows. A BRIN (Block Range Index) is 100x smaller than a B-Tree and highly efficient for naturally ordered data in PostgreSQL.',
                                sql: 'CREATE INDEX idx_activity_brin ON user_activity_logs USING BRIN (created_at);'
                            },
                            {
                                type: 'PARTIAL INDEX',
                                columns: ['status', 'user_id'],
                                reason: 'Queries frequently filter for active sessions. A partial index on status="active" reduces index size and increases performance for session lookups.',
                                sql: "CREATE INDEX idx_active_sessions ON user_activity_logs (user_id) WHERE status = 'active';"
                            }
                        ]
                    },
                    {
                        table: 'product_metadata',
                        suggestions: [
                            {
                                type: 'GIN INDEX',
                                columns: ['attributes'],
                                reason: 'The "attributes" column is a JSONB blob. A GIN (Generalized Inverted Index) enables high-speed key-value lookups and containment operators (@>) inside JSON data.',
                                sql: 'CREATE INDEX idx_product_attrs_gin ON product_metadata USING GIN (attributes);'
                            }
                        ]
                    }
                ]);
                setIsAnalyzing(false);
                toast.success('Neural analysis complete. Recommendations optimized.');
            }, 2000);
            return;
        }

        try {
            const response = await axios.post('/convert/advise-indexes', {
                source: sourceConn,
                source_type: sourceType,
            });

            if (response.data.success) {
                setRecommendations(response.data.data.recommendations);
                toast.success('Neural analysis complete.');
            } else {
                throw new Error(response.data.error);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'AI Advice failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Primary SQL DDL copied to terminal');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <Badge variant="outline" className="w-fit px-4 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                        Neural Optimization Lab
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic px-1">
                        Neural Advisor
                    </h2>
                </div>
            }
        >
            <Head title="Neural Advisor" />

            <div className="py-6 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all pb-24">
                {/* Intro Section */}
                <section className="space-y-6 max-w-3xl">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-foreground uppercase italic px-1">
                        Performance <span className="text-primary italic">Neural.</span>
                    </h1>
                    <p className="text-xl text-foreground/40 font-bold leading-relaxed tracking-tight">
                        Let AI analyze your table structures and suggest PostgreSQL-native indexing strategies like GIN, BRIN, and Partial indexes to maximize IOPS across sharded nodes.
                    </p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Setup Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="glass-card rounded-[3.5rem] p-10 border-foreground/5 dark:border-white/5 relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                <Cpu className="h-32 w-32 text-primary" />
                            </div>
                            
                            <div className="flex items-center gap-4 mb-12">
                                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 ring-1 ring-primary/30">
                                    <Database className="h-7 w-7 text-primary shadow-glow-primary" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-foreground leading-none">Source Anatomy</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2 italic">Fabric Type</Label>
                                    <select
                                        className="w-full bg-foreground/[0.02] border border-foreground/5 dark:border-white/10 rounded-2xl px-6 py-5 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceType}
                                        onChange={(e) => setSourceType(e.target.value)}
                                    >
                                        <option value="mysql">MySQL Engine</option>
                                        <option value="oracle">Oracle Node</option>
                                        <option value="sqlserver">T-SQL Node</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2 italic">Node Host</Label>
                                    <input
                                        className="w-full bg-foreground/[0.02] border border-foreground/5 dark:border-white/10 rounded-2xl px-6 py-5 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none italic"
                                        value={sourceConn.host}
                                        onChange={e => setSourceConn({ ...sourceConn, host: e.target.value })}
                                        placeholder="ENDPOINT_ADDRESS"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-2 italic">Target Namespace</Label>
                                    <input
                                        className="w-full bg-foreground/[0.02] border border-foreground/5 dark:border-white/10 rounded-2xl px-6 py-5 text-[13px] font-black uppercase tracking-tight text-foreground focus:ring-2 ring-primary transition-all outline-none italic"
                                        value={sourceConn.db}
                                        onChange={e => setSourceConn({ ...sourceConn, db: e.target.value })}
                                        placeholder="REGISTRY_ID"
                                    />
                                </div>
                            </div>
                        </Card>

                        <div className="flex gap-4">
                            <Button
                                className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_60px_rgba(var(--primary),0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 ring-1 ring-white/20"
                                onClick={handleAdvise}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Synaptic Pulse...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Generate Neural Plan
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className={`rounded-[2.5rem] h-20 px-8 border-foreground/10 dark:border-white/10 transition-all ${isSimulating ? 'bg-amber-500 text-black border-amber-600 shadow-glow-amber' : 'text-foreground/40'}`}
                                onClick={() => setIsSimulating(!isSimulating)}
                            >
                                <Activity className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {!isAnalyzing && recommendations.length === 0 && (
                                <motion.div
                                    key="standby"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-20 glass-card rounded-[4rem] border-foreground/5 shadow-2xl space-y-12"
                                >
                                    <div className="h-32 w-32 rounded-[2.5rem] bg-foreground/[0.02] flex items-center justify-center border border-foreground/5 shadow-inner relative">
                                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                                        <Sparkles className="h-12 w-12 text-foreground/20 relative z-10" />
                                    </div>
                                    <div className="space-y-4 max-w-sm">
                                        <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none">Advisor Standby</h3>
                                        <p className="text-foreground/30 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                                            Provide node connection parameters to begin the neural structural optimization sequence.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {isAnalyzing && (
                                <motion.div
                                    key="analyzing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-20 glass-card rounded-[4rem] border-foreground/5 space-y-16"
                                >
                                    <div className="relative">
                                        <div className="h-48 w-48 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="h-16 w-16 text-primary animate-pulse shadow-glow-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black tracking-tighter uppercase italic text-foreground animate-pulse">Neural Transpilation...</h3>
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                                            Running GIN/BRIN/PARTIAL Heuristics
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {recommendations.length > 0 && !isAnalyzing && (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    {recommendations.map((rec, i) => (
                                        <Card key={i} className="glass-card rounded-[3.5rem] border-foreground/5 p-12 shadow-2xl relative group/card hover:border-primary/20 transition-all">
                                            <div className="flex items-center justify-between mb-12">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 bg-primary/10 rounded-[1.8rem] flex items-center justify-center border border-primary/10 ring-1 ring-primary/20">
                                                        <Database className="h-7 w-7 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground leading-none mb-2">{rec.table}</h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">PostgreSQL Performance Optimizer</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="px-6 py-2 rounded-2xl border-emerald-500/20 text-emerald-500 bg-emerald-500/5 text-[10px] font-black uppercase tracking-widest shadow-glow-emerald">
                                                    {rec.suggestions.length} Neural Insights
                                                </Badge>
                                            </div>

                                            <div className="space-y-10">
                                                {rec.suggestions.map((suggestion: any, si: number) => (
                                                    <div key={si} className="space-y-8 p-10 rounded-[3rem] bg-foreground/[0.02] border border-foreground/5 hover:bg-foreground/[0.04] transition-all relative overflow-hidden group/item">
                                                        <div className="flex items-start justify-between relative z-10">
                                                            <div className="space-y-6 max-w-[75%]">
                                                                <div className="flex items-center gap-4">
                                                                    <Badge className="rounded-xl font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-primary text-black ring-1 ring-white/20 whitespace-nowrap">
                                                                        {suggestion.type}
                                                                    </Badge>
                                                                    <div className="h-[1px] w-12 bg-foreground/10" />
                                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic truncate">
                                                                        {suggestion.columns.join(' • ')}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <h4 className="text-xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-3">
                                                                        <Sparkles className="h-5 w-5 text-primary/40 group-hover/item:text-primary transition-colors" />
                                                                        Neural Rationale
                                                                    </h4>
                                                                    <p className="text-sm font-bold text-foreground/40 leading-relaxed tracking-tight">{suggestion.reason}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-3">
                                                                <Button
                                                                    onClick={() => copyToClipboard(suggestion.sql)}
                                                                    className="rounded-2xl h-14 w-14 bg-foreground/5 border border-foreground/10 hover:bg-primary/10 hover:border-primary/30 transition-all group/btn"
                                                                >
                                                                    <Copy className="h-5 w-5 text-foreground/30 group-hover/btn:text-primary transition-colors hover:scale-110 active:scale-95" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="rounded-[2.2rem] overflow-hidden border border-foreground/5 shadow-2xl relative z-10 group/code">
                                                            <div className="px-6 py-3 bg-foreground/5 flex items-center justify-between border-b border-foreground/5">
                                                                <div className="flex items-center gap-3">
                                                                    <Code2 className="h-3 w-3 text-primary/40" />
                                                                    <span className="text-[9px] font-black tracking-[0.3em] uppercase text-foreground/20">Production DDL Engine</span>
                                                                </div>
                                                                <ChevronRight className="h-3 w-3 text-foreground/10" />
                                                            </div>
                                                            <div className="p-1 pb-2">
                                                                <CodeHighlighter
                                                                    code={suggestion.sql}
                                                                    language="sql"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Performance Footer */}
                <footer className="p-1 bg-gradient-to-r from-primary/20 via-amber-500/20 to-primary/20 rounded-[4.5rem] shadow-2xl relative">
                    <div className="p-14 rounded-[4.2rem] bg-background/60 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-12 border border-white/5 overflow-hidden">
                        <div className="absolute top-0 left-0 p-12 opacity-[0.03] pointer-events-none group-hover:-rotate-12 transition-transform">
                            <Rocket className="w-80 h-80 text-primary" />
                        </div>
                        <div className="flex items-center gap-10 relative z-10">
                            <div className="h-24 w-24 bg-amber-500/20 rounded-[2.8rem] flex items-center justify-center ring-1 ring-amber-500/30 shadow-2xl">
                                <Info className="text-amber-500 h-10 w-10 shadow-glow-amber-small" />
                            </div>
                            <div className="text-center md:text-left space-y-2">
                                <h3 className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">Architectural Intelligence</h3>
                                <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-widest">PostgreSQL indexing can reduce disk I/O by 90% across sharded fabric.</p>
                            </div>
                        </div>
                        
                        <Link href="/docs" className="relative z-10">
                            <Button className="group relative rounded-3xl px-12 h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_20px_60px_rgba(var(--primary),0.3)] ring-1 ring-white/20">
                                <span className="relative flex items-center gap-4">
                                    Knowledge Hub
                                    <MessageSquare className="h-4 w-4" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </footer>
            </div>

            <style>{`
                .glass-card { background: rgba(var(--background), 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
                .shadow-glow-primary { filter: drop-shadow(0 0 12px rgba(var(--primary), 0.4)); }
                .shadow-glow-amber { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3)); shadow-amber-500/40; }
                .shadow-glow-amber-small { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4)); }
                .shadow-glow-emerald { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.2)); }
            `}</style>
        </AuthenticatedLayout>
    );
}
