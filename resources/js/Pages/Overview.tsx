import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Compass, Shield, Cpu,
  Layers, Code2, GitBranch,
  Terminal, Zap, CheckCircle2,
  ArrowRight, Github
} from 'lucide-react';
import { motion } from 'framer-motion';

const Overview: React.FC = () => {
  const pillars = [
    {
      title: 'Structural Fidelity',
      desc: 'Ensuring 100% schema integrity by mathematically mapping MySQL types to high-precision PostgreSQL equivalents.',
      icon: <Layers className="h-6 w-6 text-primary" />
    },
    {
      title: 'Dev-First Safety',
      desc: 'Every transformation is backed by atomic rollback engines and PII masking via FakerPHP for secure staging.',
      icon: <Shield className="h-6 w-6 text-emerald-400" />
    },
    {
      title: 'AI Translation',
      desc: 'Neural-enhanced query transpilation for application-level SQL, supporting complex legacy MySQL functions.',
      icon: <Cpu className="h-6 w-6 text-amber-500" />
    }
  ];

  const guidelines = [
    {
      title: 'Migration Protocol',
      steps: [
        'Analyze: Run the schema structural audit to detect legacy patterns.',
        'Transform: Execute the conversion with framework-specific optimizations.',
        'Verify: Utilize the auto-generated integrity script for count validation.',
        'Safely Revert: Always download the atomic rollback SQL before deployment.'
      ]
    },
    {
      title: 'Code Guidelines',
      steps: [
        'Pure Transpilation: Core logic remains stateless to prevent data leakage.',
        'High-Performance RegEx: Utilize the optimized regex engine for sub-10ms query translation.',
        'Synthetic Masking: Never export raw production PII to non-production environments.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head>
        <title>Project Overview & Guidelines | MySQL to PostgreSQL</title>
        <meta name="description" content="Explore the architecture, vision, and operational guidelines of the SQL Decoded database migration ecosystem. From PII masking to enterprise rollback engines." />
      </Head>

      {/* Background Cinematic Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <span className="font-bold text-xl tracking-tight">
            Converter<span className="text-primary text-2xl">.</span>System
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest opacity-60 px-4">
          Project Hub v4.0
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/docs">
            <Button variant="ghost" className="rounded-full font-black text-[10px] px-6 h-9 border border-white/5 uppercase tracking-widest">Documentation</Button>
          </Link>
        </div>
      </nav>

      <main className="container max-w-6xl mx-auto px-4 pt-32 pb-20 relative z-10">
        <section className="mb-20 space-y-6">
          <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            System Architecture & Vision
          </Badge>
          <h1 className="text-7xl font-black tracking-tighter leading-[0.9] mb-8">
            Enterprise Data<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-emerald-400">Transpilation Engine.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-3xl leading-relaxed">
            Beyond simple field mapping, this project represents a comprehensive lifecycle strategy for migrating high-uptime MySQL applications to resilient PostgreSQL architectures.
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
              <Card className="glass-card rounded-[2.5rem] p-10 border-white/10 hover:border-primary/20 transition-all group h-full">
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
            {guidelines.map((g, i) => (
              <div key={i} className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-primary rounded-full transition-transform hover:scale-y-110" />
                  {g.title}
                </h2>
                <div className="space-y-4 prose prose-invert">
                  {g.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="text-primary font-black text-xs pt-1 opacity-40">0{idx + 1}</div>
                      <p className="text-sm font-medium text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Card className="relative overflow-hidden bg-slate-900/40 rounded-[3rem] border-white/10 p-12 lg:h-full flex flex-col justify-center gap-8 group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Terminal className="h-64 w-64 text-primary" />
            </div>
            <div className="space-y-8 relative z-10">
              <div className="space-y-2">
                <h3 className="text-4xl font-black tracking-tighter uppercase italic text-primary">Technical Roadmap</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Future State Architecture</p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: <GitBranch />, text: "Direct Schema Streaming via WebSockets", active: true },
                  { icon: <CheckCircle2 />, text: "Automated Laravel Migration File Generation", active: true },
                  { icon: <Cpu />, text: "Advanced Neural Procedural Logic Transpiler", active: false },
                  { icon: <Code2 />, text: "Python/Go Engine Compatibility Bindings", active: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 ${item.active ? 'opacity-100' : 'opacity-30 underline decoration-white/10'}`}>
                    <div className={`p-2 rounded-lg ${item.active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white'}`}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer">
                <Button className="w-fit flex items-center rounded-2xl px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-[0_20px_50px_rgba(var(--primary),0.2)]">
                  Contribute Today <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </Card>
        </section>

        <footer className="pt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
          <div className="text-[10px] font-black uppercase tracking-widest">© 2026 Core Transformation Engineering Hub</div>
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
