import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Rocket, Shield,
  Github,
  Activity, Database,
  Cpu
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';

const Docs: React.FC = () => {
  const sections = [
    {
      id: 'quick-start',
      title: 'Quick Start',
      icon: <Rocket className="h-5 w-5 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">SQL STREAM is engineered for zero-artifact database migrations. Connect MySQL, Oracle, or SQL Server directly and stream to PostgreSQL with zero-downtime.</p>
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 font-mono text-xs group relative overflow-hidden">
            <p className="text-primary/80 mb-2"># Initialize a live migration</p>
            <p className="text-white">php artisan convert:stream --source=oracle --target=pgsql</p>
          </div>
        </div>
      ),
    },
    {
      id: 'source-adapters',
      title: 'Multi-Source Fabric',
      icon: <Database className="h-5 w-5 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Our enterprise adapter fabric supports high-fidelity transpilation from diverse engines:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Oracle', desc: 'Automatic mapping of RAW, CLOB, and NUMBER(p,s) to native PG types.' },
              { name: 'SQL Server', desc: 'T-SQL to PL/pgSQL conversion with bracketed identifier normalization.' },
              { name: 'MySQL', desc: 'Full support for Enums, JSON, and complex spatial types.' }
            ].map(f => (
              <div key={f.name} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <h6 className="font-black text-[10px] uppercase tracking-widest mb-2 text-primary">{f.name}</h6>
                <p className="text-[10px] opacity-60 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'mission-control',
      title: 'Mission Control',
      icon: <Activity className="h-5 w-5 text-emerald-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">The Orchestrator provides real-time telemetry into the migration network fabric.</p>
          <ul className="text-sm space-y-2 text-muted-foreground ml-4 list-disc">
            <li><span className="text-white font-bold">Throughput Analysis:</span> Live charting of Records per Second (RPS).</li>
            <li><span className="text-white font-bold">Progress Sharding:</span> Table-level monitoring of sync states.</li>
            <li><span className="text-white font-bold">Final Cutover:</span> Atomic finalization with bindlog/CDC parity checks.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ai-index-advisor',
      title: 'Neural Index Advisor',
      icon: <Cpu className="h-5 w-5 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Leverage Google Gemini to optimize your target PostgreSQL architecture. NTE scans your source schema and suggests high-performance indexing strategies like GIN and BRIN.</p>
        </div>
      ),
    },
    {
      id: 'integrity-audit',
      title: 'Integrity Auditing',
      icon: <Shield className="h-5 w-5 text-red-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Ensure 100% data parity between sharded nodes.</p>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
             <code className="text-xs text-white">Validation::parityCheck($source, $target); // Row-count & MD5 parity</code>
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head>
        <title>Engineering Docs | SQL STREAM</title>
        <meta name="description" content="Technical documentation for the SQL STREAM database transformation ecosystem. Multi-node streaming, neural transpilation, and staging defense." />
      </Head>
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between backdrop-blur-xl transition-all">
        <div className="flex items-center gap-4">
          <Link href="/" className="bg-primary/20 p-2.5 rounded-xl ring-1 ring-primary/30">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter leading-none">
              SQL<span className="text-primary italic">STREAM</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Documentation</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/support" className="hidden md:block">
            <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9">Concierge</Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 h-9 w-9 p-0 flex items-center justify-center border border-white/5">
            <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </nav>

      <main className="container max-w-6xl mx-auto px-4 pt-32 pb-20 relative z-10 flex flex-col md:flex-row gap-16">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-6">
          <div className="sticky top-32 space-y-8">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-6 px-4">System Guide</div>
              <div className="space-y-1">
                {sections.map(s => (
                  <a 
                    key={s.id} 
                    href={`#${s.id}`} 
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 group"
                  >
                    <div className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            <Card className="p-6 glass-card rounded-[2rem] border-white/5 space-y-4 shadow-2xl">
              <h5 className="text-xs font-black uppercase tracking-widest">Need Expert Help?</h5>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Join our enterprise cluster for 24/7 engineering support and architectural reviews.</p>
              <Link href="/support">
                <Button variant="outline" className="w-full rounded-xl text-[9px] font-black uppercase tracking-widest border-white/10 h-10">Open Inquiry</Button>
              </Link>
            </Card>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-24">
          <section>
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary text-[10px] py-1 px-4 uppercase tracking-[0.3em] font-black rounded-full">
              Core Documentation
            </Badge>
            <h1 className="text-6xl font-black tracking-tighter mb-8 leading-none">Engineering<br />The Pipeline<span className="text-primary italic">.</span></h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
              Master the high-performance SQL STREAM ecosystem. From complex structural transpilation to zero-downtime live migrations.
            </p>
          </section>

          {sections.map(section => (
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={section.id} 
              id={section.id} 
              className="space-y-8 scroll-mt-32"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 ring-1 ring-white/5 shadow-xl">
                  {section.icon}
                </div>
                <h2 className="text-4xl font-black tracking-tighter">{section.title}</h2>
              </div>
              <div className="prose prose-invert max-w-none ml-2">
                {section.content}
              </div>
            </motion.section>
          ))}

          <footer className="pt-20 border-t border-white/5 text-center">
            <div className="flex items-center justify-center gap-3 mb-4 opacity-40">
              <Database className="h-4 w-4" />
              <div className="h-px w-12 bg-white/20" />
              <Shield className="h-4 w-4" />
              <div className="h-px w-12 bg-white/20" />
              <Zap className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em]">© 2026 SQL STREAM INFRASTRUCTURE</p>
          </footer>
        </div>
      </main>

      <style>{`
        html { scroll-behavior: smooth; }
        .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>
    </div>
  );
};

export default Docs;
