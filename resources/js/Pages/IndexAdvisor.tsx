import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    Zap, Server,
    Database, MessageSquare,
    Terminal, Maximize2, Loader2, Sparkles,
    Info, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { CodeHighlighter } from '@/components/ui/syntax-highlighter';

const IndexAdvisor: React.FC = () => {
    const [sourceConn, setSourceConn] = useState({ host: 'localhost', port: '3306', user: '', pass: '', db: '' });
    const [sourceType, setSourceType] = useState('mysql');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    const handleAdvise = async () => {
        if (!sourceConn.db) {
            toast.error('Source database details are required.');
            return;
        }

        setIsAnalyzing(true);
        setRecommendations([]);

        try {
            const response = await axios.post('/convert/advise-indexes', {
                source: sourceConn,
                source_type: sourceType,
            });

            if (response.data.success) {
                setRecommendations(response.data.data.recommendations);
                toast.success('AI Data analysis completed. ⚡️');
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
        toast.success('SQL Command copied to clipboard');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
            <Head>
                <title>PostgreSQL Index Advisor | SQL STREAM AI</title>
                <meta name="description" content="AI-powered database index suggestions. Optimize your PostgreSQL migration with GIN, BRIN, and Partial indexes automatically recommended by neural insights." />
            </Head>

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
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
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">AI Performance Labs</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-4">
                        <Link href="/validation" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Validation</Link>
                        <Link href="/index-advisor" className="text-[10px] font-black uppercase tracking-widest text-primary">Index Advisor</Link>
                        <Link href="/docs" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Docs</Link>
                    </div>
                    <ThemeToggle />
                    <Link href="/support">
                        <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9 text-white hover:bg-white/5 hover:text-white">Concierge</Button>
                    </Link>
                </div>
            </nav>

            <main className="container max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <section className="text-center mb-20 space-y-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-xl"
                    >
                        <Sparkles className="h-4 w-4" />
                        Neural Optimization Protocol v2.5
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">Advanced<br />Index Advisor<span className="text-primary italic">.</span></h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">Let AI analyze your table structures and suggest PostgreSQL-native indexing strategies like GIN, BRIN, and Partial indexes to maximize IOPS.</p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Input Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="glass-card rounded-[2.5rem] border-white/10 p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                                <Maximize2 className="h-10 w-24" />
                            </div>
                            <h2 className="text-lg font-black tracking-tight text-white mb-8 flex items-center gap-3">
                                <Server className="h-5 w-5 text-primary" />
                                Target Anatomy
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Engine Engine</Label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceType}
                                        onChange={(e) => setSourceType(e.target.value)}
                                    >
                                        <option value="mysql">MySQL Engine</option>
                                        <option value="oracle">Oracle Database</option>
                                        <option value="sqlserver">SQL Server</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Endpoint Host</Label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceConn.host}
                                        onChange={e => setSourceConn({ ...sourceConn, host: e.target.value })}
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

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Identity (User)</Label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:ring-2 ring-primary transition-all outline-none"
                                        value={sourceConn.user}
                                        onChange={e => setSourceConn({ ...sourceConn, user: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Button
                            className="w-full h-16 rounded-[1.8rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            onClick={handleAdvise}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Synaptic Analysis...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    Generate AI Insights
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {!isAnalyzing && recommendations.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5"
                                >
                                    <div className="h-24 w-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/10 mb-8">
                                        <Sparkles className="h-10 w-10 opacity-20" />
                                    </div>
                                    <div className="space-y-2 text-white">
                                        <h3 className="text-2xl font-black tracking-tight">AI Advisor Standby</h3>
                                        <p className="text-muted-foreground text-sm font-medium">Please provide connection parameters to begin the architectural audit sequence.</p>
                                    </div>
                                </motion.div>
                            )}

                            {isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass-card rounded-[3rem] border-white/5 space-y-10"
                                >
                                    <div className="relative">
                                        <div className="h-40 w-40 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black tracking-tighter text-white">Neural Transpilation in Progress</h3>
                                        <p className="text-sm font-black uppercase tracking-[0.2em] opacity-40 animate-pulse">Running GIN/BRIN/PARTIAL Heuristics...</p>
                                    </div>
                                </motion.div>
                            )}

                            {recommendations.length > 0 && !isAnalyzing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {recommendations.map((rec, i) => (
                                        <Card key={i} className="glass-card rounded-[2.5rem] border-white/10 p-10 shadow-2xl relative group hover:border-primary/30 transition-all">
                                            <div className="flex items-center justify-between mb-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center ring-1 ring-primary/40">
                                                        <Database className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black tracking-tighter text-white leading-none mb-1">{rec.table}</h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">PostgreSQL Performance Archetype</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest">{rec.suggestions.length} Improvements</Badge>
                                            </div>

                                            <div className="space-y-8">
                                                {rec.suggestions.map((suggestion: any, si: number) => (
                                                    <div key={si} className="space-y-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all relative overflow-hidden group/item">
                                                        <div className="flex items-start justify-between relative z-10">
                                                            <div className="space-y-4 max-w-[70%]">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="default" className="rounded-lg font-black text-[9px] uppercase tracking-widest px-3 py-1 scale-110">{suggestion.type}</Badge>
                                                                    <div className="h-[1px] w-8 bg-white/10" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 italic">{suggestion.columns.join(', ')}</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <h4 className="text-lg font-black tracking-tight text-white flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                                                        <Sparkles className="h-4 w-4 opacity-40" />
                                                                        AI Rationale
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{suggestion.reason}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 h-10 border-white/10 hover:bg-white/10 shadow-xl"
                                                                onClick={() => copyToClipboard(suggestion.sql)}
                                                            >
                                                                <Terminal className="h-3 w-3 mr-2" />
                                                                Snippet
                                                            </Button>
                                                        </div>

                                                        <div className="rounded-[1.5rem] overflow-hidden border border-white/5 shadow-2xl relative z-10 group/code">
                                                            <div className="px-5 py-2 bg-white/5 flex items-center justify-between border-b border-white/5">
                                                                <span className="text-[8px] font-black tracking-widest uppercase opacity-30">Production DDL Command</span>
                                                                <ChevronRight className="h-3 w-3 text-white/20 group-hover/code:text-primary transition-colors" />
                                                            </div>
                                                            <CodeHighlighter
                                                                code={suggestion.sql}
                                                                language="sql"
                                                            />
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

                <footer className="mt-20 p-1 bg-gradient-to-r from-primary/30 via-amber-500/20 to-primary/30 rounded-[3.5rem] shadow-2xl">
                    <div className="p-12 rounded-[3.2rem] bg-background/60 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-12 border border-white/5">
                        <div className="flex items-center gap-8">
                            <div className="h-20 w-20 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center ring-1 ring-amber-500/30 shadow-inner">
                                <Info className="text-amber-500 h-10 w-10" />
                            </div>
                            <div className="text-center md:text-left space-y-2">
                                <h3 className="text-3xl font-black tracking-tighter text-white">Architectural Guidance</h3>
                                <p className="text-sm text-muted-foreground font-medium">PostgreSQL indexing can reduce disk I/O by 90% when using the correct data types.</p>
                            </div>
                        </div>

                        <Link href="/docs">
                            <Button className="group relative rounded-2xl px-12 py-8 font-black uppercase tracking-[0.2em] text-[10px] overflow-hidden transition-all bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <span className="relative flex items-center gap-3">
                                    Knowledge Hub
                                    <MessageSquare className="h-4 w-4" />
                                </span>
                            </Button>
                        </Link>
                    </div>
                </footer>
            </main>

            <style>{`
                .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); }
                .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px); }
                .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
            `}</style>
        </div>
    );
};

export default IndexAdvisor;
