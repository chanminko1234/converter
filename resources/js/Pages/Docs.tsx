import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Terminal,
  Rocket, Shield,
  FileJson, Github, Search,
  Activity, Eraser, Database,
  Lock, RefreshCcw, Cpu, Globe
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
          <p className="text-muted-foreground font-medium">SQL STREAM is engineered for zero-artifact database migrations. Get started via the CLI or use our live streaming node cluster.</p>
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 font-mono text-xs group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-40 transition-opacity">
              <Terminal className="h-4 w-4" />
            </div>
            <p className="text-primary/80 mb-2"># Install the stream engine</p>
            <p className="text-white">composer require sql-stream/core</p>
            <p className="text-white">npm install @sql-stream/react</p>
            <p className="text-primary/80 mt-4 mb-2"># Initialize a live migration node</p>
            <p className="text-white">php artisan stream:init --cluster=us-east-1</p>
          </div>
        </div>
      ),
    },
    {
      id: 'neural-engine',
      title: 'Predictive AI Transpiler',
      icon: <Cpu className="h-5 w-5 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Our Neural Transpilation Engine (NTE) goes beyond regex. It understands the abstract syntax tree (AST) of your MySQL queries and maps them to highly optimized PostgreSQL equivalents.</p>
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 font-mono text-xs">
            <p className="text-amber-500/80 mb-2">-- Legacy MySQL Pattern</p>
            <p className="text-white/60 italic">SELECT name, GROUP_CONCAT(role SEPARATOR '|') FROM users GROUP BY name;</p>
            <p className="text-emerald-500/80 mt-4 mb-2">-- Neural Optimized PostgreSQL</p>
            <p className="text-white">SELECT name, string_agg(role, '|') FROM "users" GROUP BY name;</p>
          </div>
          <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Supported: Recursive CTEs, Stored Procedures, Cross-Schema Triggers</p>
        </div>
      ),
    },
    {
      id: 'direct-streaming',
      title: 'Live Node Streaming',
      icon: <Activity className="h-5 w-5 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground font-medium">Connect directly to a source MySQL node and stream data to a target PostgreSQL cluster with zero-downtime and sub-millisecond lag.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="p-5 bg-white/5 border-white/5 rounded-2xl hover:bg-white/[0.08] transition-colors">
               <div className="flex items-center gap-2 mb-2">
                 <RefreshCcw className="h-3 w-3 text-blue-400" />
                 <h5 className="font-bold text-[10px] uppercase tracking-widest">Delta Sync</h5>
               </div>
               <p className="text-[11px] opacity-70 leading-relaxed">Only migrates changes (INSERT/UPDATE/DELETE) since the last high-water mark, minimizing network load.</p>
             </Card>
             <Card className="p-5 bg-white/5 border-white/5 rounded-2xl hover:bg-white/[0.08] transition-colors">
               <div className="flex items-center gap-2 mb-2">
                 <Globe className="h-3 w-3 text-blue-400" />
                 <h5 className="font-bold text-[10px] uppercase tracking-widest">Global Clusters</h5>
               </div>
               <p className="text-[11px] opacity-70 leading-relaxed">Distribute migration workload across our globally edge-optimized transformation nodes.</p>
             </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'staging-synthesis',
      title: 'Staging Synthesis',
      icon: <Lock className="h-5 w-5 text-emerald-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Protect your production data. Our PII Defense engine automatically obfuscates sensitive information during the stream.</p>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10">
            <h5 className="font-bold text-xs mb-3 text-emerald-400 flex items-center gap-2">
              <Search className="h-3 w-3" /> PII Discovery Patterns
            </h5>
            <ul className="text-[11px] space-y-2 opacity-80 list-disc ml-4">
              <li>Automatic detection of <code>email</code>, <code>phone_number</code>, and <code>ssn</code> columns.</li>
              <li>Context-aware FakerPHP synthesis for realistic dev data.</li>
              <li>Encrypted-at-rest buffers for all staging transpiler workflows.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'framework-presets',
      title: 'Framework Presets',
      icon: <FileJson className="h-5 w-5 text-amber-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Optimized logic for the world's most popular database-heavy ecosystems.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Laravel', color: 'text-amber-500', desc: 'UUID primary key support & Migration file exports.' },
              { name: 'Wordpress', color: 'text-blue-400', desc: 'Serialized PHP data parsing & URL rewriting.' },
              { name: 'Magento', color: 'text-orange-500', desc: 'EAV table flattening & high-performance joins.' }
            ].map(f => (
              <div key={f.name} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <h6 className={`font-black text-[10px] uppercase tracking-widest mb-2 ${f.color}`}>{f.name}</h6>
                <p className="text-[10px] opacity-60 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'rollback-engine',
      title: 'Atomic Rollback',
      icon: <Eraser className="h-5 w-5 text-red-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground font-medium">Never deploy without a safety net. Every migration generates a cryptographically signed rollback script.</p>
          <div className="bg-slate-900 ring-1 ring-white/10 p-5 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400/60">
               <Shield className="h-3 w-3" /> Integrity Lock
             </div>
             <p className="text-[11px] opacity-70 italic">"Rollback scripts analyze the target state to ensure that reversing a migration will not cause data loss in newly formed relations."</p>
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
