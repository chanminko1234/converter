import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Terminal, Code,
  Rocket, Shield, Settings,
  Database, FileJson, Github
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';

const Docs: React.FC = () => {
  const sections = [
    {
      id: 'quick-start',
      title: 'Quick Start',
      icon: <Zap className="h-5 w-5 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">The MySQL to PostgreSQL Converter is designed for high-performance database migrations. Get started by pasting your MySQL dump or uploading a file directly.</p>
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 font-mono text-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-40 transition-opacity">
              <Terminal className="h-4 w-4" />
            </div>
            <p className="text-primary/80 mb-2"># Install dependencies</p>
            <p className="text-white">composer install</p>
            <p className="text-white">npm install && npm run build</p>
            <p className="text-primary/80 mt-4 mb-2"># Run the engine</p>
            <p className="text-white">php artisan serve</p>
          </div>
        </div>
      ),
    },
    {
      id: 'core-features',
      title: 'Core Features',
      icon: <Shield className="h-5 w-5 text-purple-400" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Type Mapping', desc: 'Automatic MySQL to PostgreSQL type conversion including TINYINT to BOOLEAN.', icon: <Database /> },
            { title: 'Complex Logic', desc: 'Converts triggers, stored procedures, and complex constraints accurately.', icon: <Code /> },
            { title: 'Large Files', desc: 'Stream-based processing handles files up to 100MB+ without memory issues.', icon: <Rocket /> },
            { title: 'Excel/CSV Export', desc: 'Direct export to high-fidelity Excel and CSV formats for data analysis.', icon: <FileJson /> },
          ].map((f, i) => (
            <div key={i} className="p-4 rounded-2xl glass border border-white/5 hover:border-primary/20 transition-all group">
              <div className="p-2 w-fit rounded-lg bg-white/5 mb-3 group-hover:bg-primary/10 transition-colors">
                {React.cloneElement(f.icon as React.ReactElement<any>, { className: "h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" })}
              </div>
              <h4 className="font-bold mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'api-usage',
      title: 'API Integration',
      icon: <Code className="h-5 w-5 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Integrate the transformation engine directly into your automation pipelines using our RESTful API.</p>
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 font-mono text-sm">
            <p className="text-emerald-400 font-bold mb-2">POST /convert</p>
            <div className="text-white whitespace-pre">{`{
  "mysql_dump": "CREATE TABLE users...",
  "target_format": "postgresql",
  "options": {
    "preserveIdentity": true
  }
}`}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'configuration',
      title: 'Configuration',
      icon: <Settings className="h-5 w-5 text-amber-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Fine-tune the conversion engine using Environment Variables or the UI Options panel.</p>
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 font-mono text-sm">
            <p className="text-primary/80 mb-2"># .env configuration</p>
            <p className="text-white">DB_CONNECTION=sqlite</p>
            <p className="text-white">SESSION_DRIVER=file</p>
            <p className="text-primary/80 mt-4 mb-2"># Engine limits</p>
            <p className="text-white">UPLOAD_MAX_SIZE=100M</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head title="Documentation - SQL Decoded" />
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <span className="font-bold text-xl tracking-tight">
            Converter<span className="text-primary text-2xl">.</span>Docs
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/support" className="hidden md:block">
            <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9">Support</Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 h-9 w-9 p-0 flex items-center justify-center">
            <a href="https://github.com/chanminko1234/converter" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </nav>

      <main className="container max-w-6xl mx-auto px-4 pt-32 pb-20 relative z-10 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-6">
          <div className="sticky top-32 space-y-8">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 block">Navigation</Label>
              <div className="space-y-1">
                {sections.map(s => (
                  <a 
                    key={s.id} 
                    href={`#${s.id}`} 
                    className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-all text-sm font-bold opacity-60 hover:opacity-100 group"
                  >
                    <div className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            <Card className="p-6 glass-card rounded-3xl border-white/5 space-y-4">
              <h5 className="text-sm font-bold">Need Help?</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">Our engine is built to handle the most complex MySQL syntax. If you find a bug, please report it.</p>
              <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-white/10">Read Changelog</Button>
            </Card>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-20">
          <section>
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary text-[10px] py-0.5 px-3 uppercase tracking-[0.2em] font-black">
              Documentation
            </Badge>
            <h1 className="text-5xl font-black tracking-tight mb-6">Engine Documentation<span className="text-primary">.</span></h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
              Welcome to the SQL Decoded documentation. This guide will help you understand how to use our transformation engine effectively.
            </p>
          </section>

          {sections.map(section => (
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={section.id} 
              id={section.id} 
              className="space-y-6 scroll-mt-32"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  {section.icon}
                </div>
                <h2 className="text-3xl font-bold tracking-tight">{section.title}</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                {section.content}
              </div>
            </motion.section>
          ))}

          <footer className="pt-20 border-t border-white/5 text-center">
            <p className="text-sm font-bold opacity-30 uppercase tracking-widest">© 2026 Converter Tooling System</p>
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

// Simple Label component since I don't want to import it from UI if it's missing or different
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={className}>{children}</span>
);

export default Docs;
