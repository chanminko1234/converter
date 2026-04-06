import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Activity, Zap, Shield, Server, 
  Clock, MessageSquare, Cpu, 
  RefreshCcw, Globe, Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';

const Status: React.FC = () => {
  const services = [
    { name: 'Core Transformation Engine', status: 'operational', uptime: '99.99%', latency: '38ms', icon: <Server /> },
    { name: 'Neural Transpilation Node', status: 'operational', uptime: '99.96%', latency: '112ms', icon: <Cpu /> },
    { name: 'Staging Synthesis Cluster', status: 'operational', uptime: '100%', latency: '54ms', icon: <Shield /> },
    { name: 'Delta Sync Worker v4', status: 'operational', uptime: '100%', latency: '08ms', icon: <RefreshCcw /> },
    { name: 'Integrity Audit Pipeline', status: 'operational', uptime: '99.99%', latency: '29ms', icon: <Activity /> },
    { name: 'PG Architect Advisor', status: 'operational', uptime: '100%', latency: '215ms', icon: <Zap /> },
    { name: 'Global REST Edge API', status: 'operational', uptime: '99.98%', latency: '45ms', icon: <Globe /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head>
        <title>System Status | SQL STREAM</title>
        <meta name="description" content="View the real-time operational status and uptime of the SQL STREAM migration ecosystem. Performance tracking for neural nodes and sync workers." />
      </Head>
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-primary/20 p-2.5 rounded-xl ring-1 ring-primary/30">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">
              SQL<span className="text-primary italic">STREAM</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Network Status</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/support">
            <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9">Concierge</Button>
          </Link>
        </div>
      </nav>

      <main className="container max-w-5xl mx-auto px-4 pt-32 pb-20 relative z-10">
        <section className="text-center mb-24 space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-xl"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Hyper-Operational: ALL NODES ONLINE
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-6">Infrastructure<br />Health Grid<span className="text-primary italic">.</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Real-time performance metrics for the SQL STREAM globally distributed transformation network.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card rounded-[2.5rem] p-8 border-white/10 hover:border-primary/30 transition-all group overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                   {React.cloneElement(s.icon as React.ReactElement<any>, { className: "h-24 w-24" })}
                </div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="h-12 w-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {React.cloneElement(s.icon as React.ReactElement<any>, { className: "h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" })}
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black tracking-widest px-3 py-1 rounded-lg uppercase">{s.status}</Badge>
                </div>
                <h3 className="font-black mb-2 text-lg tracking-tight relative z-10">{s.name}</h3>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-30 mb-6 relative z-10">Peak Capacity Guaranteed</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Global Uptime</p>
                    <p className="font-mono text-xs font-black text-emerald-400">{s.uptime}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">IO Latency</p>
                    <p className="font-mono text-xs font-black">{s.latency}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <section className="space-y-8 mb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              Global Response Matrix (24h)
            </h2>
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-primary/40" />
               <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Updated every 30 seconds</p>
            </div>
          </div>
          
          <Card className="glass-card rounded-[3rem] border-white/10 p-12 h-80 flex items-end gap-1.5 overflow-hidden relative shadow-2xl">
            {/* Visualizer bars */}
            {Array.from({ length: 64 }).map((_, i) => (
              <motion.div 
                key={i} 
                initial={{ height: 0 }}
                animate={{ height: `${Math.floor(Math.random() * 50) + 50}%` }}
                transition={{ delay: i * 0.01, duration: 1 }}
                className="flex-1 bg-primary/10 hover:bg-primary/40 transition-all rounded-t-lg" 
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 py-6 px-12 flex justify-between items-center bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                  <Clock className="h-4 w-4" />
                  Peak Throughput Cluster: 1x-Beta-4
                </div>
                <div className="font-mono text-[10px] font-black text-primary">TRANSFORMING 14.8M OPS/s</div>
            </div>
          </Card>
        </section>

        <footer className="p-1 bg-gradient-to-r from-primary/30 via-indigo-500/30 to-primary/30 rounded-[3.5rem] shadow-2xl">
          <div className="p-12 rounded-[3.2rem] bg-background/60 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-12 border border-white/5">
            <div className="flex items-center gap-8">
              <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center ring-1 ring-primary/30 shadow-inner">
                <MessageSquare className="text-primary h-10 w-10" />
              </div>
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-3xl font-black tracking-tighter">Engineering Hub</h3>
                <p className="text-sm text-muted-foreground font-medium">Connect with the developers behind the SQL STREAM protocol.</p>
              </div>
            </div>
            
            <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer">
              <Button className="group relative rounded-2xl px-12 py-8 font-black uppercase tracking-[0.2em] text-[10px] overflow-hidden transition-all bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative flex items-center gap-3">
                  Join Community
                  <Rocket className="h-4 w-4" />
                </span>
              </Button>
            </a>
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

export default Status;
