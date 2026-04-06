import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Shield, Cpu,
  CheckCircle2,
  ArrowRight, Rocket,
  Activity, Database
} from 'lucide-react';
import { motion } from 'framer-motion';

const Overview: React.FC = () => {
  const pillars = [
    {
      title: 'Neural Fidelity',
      desc: 'Moving beyond mapping to intelligent transpilation. Our Predictive AI engine adapts to complex legacy MySQL patterns automatically.',
      icon: <Cpu className="h-6 w-6 text-primary" />
    },
    {
      title: 'Staging Defense',
      desc: 'PII masking via FakerPHP ensures your non-production environments remain functional yet 100% compliant and secure.',
      icon: <Shield className="h-6 w-6 text-emerald-400" />
    },
    {
      title: 'Mission Control',
      desc: 'Zero-downtime orchestration with real-time telemetry. Monitor throughput, parity, and perform final cutovers via a high-fidelity cockpit.',
      icon: <Activity className="h-6 w-6 text-amber-500" />
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
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head>
        <title>SQL STREAM | Technical Overview & Ecosystem</title>
        <meta name="description" content="Explore the SQL STREAM architecture. From predictive AI transpilation to direct database streaming and enterprise-grade data masking." />
      </Head>

      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-primary/20 p-2.5 rounded-xl ring-1 ring-primary/30">
            <Rocket className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">
              SQL<span className="text-primary italic">STREAM</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Engineering Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/docs" className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Documentation</Link>
            <Link href="/status" className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Network Status</Link>
          </div>
          <ThemeToggle />
          <Link href="/">
            <Button size="sm" className="rounded-full font-black text-[10px] px-6 h-9 uppercase tracking-widest shadow-lg shadow-primary/20">Launch App</Button>
          </Link>
        </div>
      </nav>

      <main className="container max-w-6xl mx-auto px-4 pt-32 pb-20 relative z-10">
        <section className="mb-20 space-y-6">
          <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            System Architecture & Vision
          </Badge>
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-emerald-400">Data Evolution.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-3xl leading-relaxed">
            SQL STREAM isn't just a converter; it's a stateful migration ecosystem designed to bridge the gap between legacy MySQL, Oracle, and SQL Server instances and resilient, modern PostgreSQL architectures.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card rounded-[2.5rem] p-10 border-white/10 hover:border-primary/20 transition-all group h-full shadow-2xl">
                <div className="p-4 bg-white/5 rounded-[1.5rem] w-fit mb-6 group-hover:bg-primary/10 transition-colors">
                  {p.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{p.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 lg:items-center">
          <div className="space-y-12">
            {ecosystem.map((g, i) => (
              <div key={i} className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-primary rounded-full transition-transform hover:scale-y-110" />
                  {g.title}
                </h2>
                <div className="space-y-4 prose prose-invert">
                  {g.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                      <div className="text-primary font-black text-xs pt-1 opacity-40">0{idx + 1}</div>
                      <p className="text-sm font-medium text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Card className="relative overflow-hidden bg-slate-900/40 rounded-[3rem] border-white/10 p-12 lg:min-h-[600px] flex flex-col justify-center gap-8 group shadow-inner">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Database className="h-64 w-64 text-primary" />
            </div>
            <div className="space-y-8 relative z-10">
              <div className="space-y-2">
                <h3 className="text-4xl font-black tracking-tighter uppercase italic text-primary">Technical Roadmap</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Active Development Cycles</p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: <Activity />, text: "Real-time Binary Log Replication", active: true },
                  { icon: <CheckCircle2 />, text: "Zero-Downtime Incremental Sync", active: true },
                  { icon: <Cpu />, text: "AI-Powered Gemini Index Advisor", active: true },
                  { icon: <Shield />, text: "Enterprise Oracle/SQL Server Adapters", active: true },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 ${item.active ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`p-2.5 rounded-xl ${item.active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white'}`}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer">
                  <Button className="w-fit flex items-center rounded-2xl px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-[0_20px_50px_rgba(var(--primary),0.2)]">
                    Contribute to Core <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </section>

        <footer className="pt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
          <div className="text-[10px] font-black uppercase tracking-widest">© 2026 SQL STREAM • High Performance Data Engineering</div>
          <div className="flex gap-10">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-primary">App</Link>
            <Link href="/docs" className="text-[10px] font-black uppercase tracking-widest hover:text-primary">Docs</Link>
            <Link href="/status" className="text-[10px] font-black uppercase tracking-widest hover:text-primary">Status</Link>
            <a href="https://github.com/chanminko1234/converter" className="text-[10px] font-black uppercase tracking-widest hover:text-primary">GitHub</a>
          </div>
        </footer>
      </main>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>
    </div>
  );
};

export default Overview;
