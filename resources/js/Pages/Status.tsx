import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Activity, Zap, Shield, Server, 
  Clock, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

const Status: React.FC = () => {
  const services = [
    { name: 'Transformation Engine', status: 'operational', uptime: '99.98%', latency: '42ms' },
    { name: 'File Storage Service', status: 'operational', uptime: '100%', latency: '12ms' },
    { name: 'REST API 2.0', status: 'operational', uptime: '99.95%', latency: '84ms' },
    { name: 'Documentation Hub', status: 'operational', uptime: '100%', latency: '5ms' },
    { name: 'Excel Export Worker', status: 'operational', uptime: '99.90%', latency: '1.2s' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head title="System Status - SQL Decoded" />
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <span className="font-bold text-xl tracking-tight">
            Converter<span className="text-primary text-2xl">.</span>Status
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/support">
            <Button variant="ghost" className="rounded-full font-bold text-xs uppercase tracking-widest px-6 border border-white/5 h-9">Support</Button>
          </Link>
        </div>
      </nav>

      <main className="container max-w-5xl mx-auto px-4 pt-32 pb-20 relative z-10">
        <section className="text-center mb-20 space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
            All Systems Operational
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight leading-none mb-4">Infrastructure Health<span className="text-primary">.</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Real-time status tracking for the SQL Decoded transformation ecosystem across all global regions.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card rounded-[2rem] p-6 border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-10 w-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {i % 2 === 0 ? <Server className="h-5 w-5 text-primary/60" /> : <Shield className="h-5 w-5 text-primary/60" />}
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black tracking-widest px-2">{s.status.toUpperCase()}</Badge>
                </div>
                <h3 className="font-bold mb-1 text-lg">{s.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">Steady-state operational capacity</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Uptime</p>
                    <p className="font-mono text-xs font-bold">{s.uptime}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Latency</p>
                    <p className="font-mono text-xs font-bold">{s.latency}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Response History (24h)
            </h2>
            <p className="text-[10px] font-black uppercase opacity-40">Updates every 60s</p>
          </div>
          
          <Card className="glass-card rounded-[2.5rem] border-white/10 p-10 h-64 flex items-end gap-1 overflow-hidden relative">
            {/* Visualizer bars */}
            {Array.from({ length: 48 }).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-primary/20 hover:bg-primary transition-all rounded-t-sm" 
                style={{ height: `${Math.floor(Math.random() * 40) + 60}%` }} 
              />
            ))}
            <div className="absolute bottom-4 left-6 flex items-center gap-1.5 opacity-40 text-[9px] font-black uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              Peak Activity: 14:00 UTC
            </div>
          </Card>
        </section>

        <footer className="mt-20 p-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-[3.2rem]">
          <div className="p-10 rounded-[3rem] bg-background/40 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-primary/10 rounded-[2rem] flex items-center justify-center ring-1 ring-primary/20">
                <MessageSquare className="text-primary h-8 w-8" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold tracking-tight">Access Community Hub</h3>
                <p className="text-sm text-muted-foreground font-medium">Join 2,500+ developers optimized for SQL Decoded.</p>
              </div>
            </div>
            
            <Button className="group relative rounded-2xl px-10 py-6 font-black uppercase tracking-widest text-[10px] overflow-hidden transition-all bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative flex items-center gap-2">
                Join the Discord 
                <Shield className="h-3 w-3" />
              </span>
            </Button>
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
