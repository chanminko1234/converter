import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  MessageCircle, HelpCircle,
  Send, Github, ExternalLink, Zap,
  Rocket, Shield, Cpu, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Support: React.FC = () => {
  const faqs = [
    { q: "What is the maximum throughput for live streaming?", a: "Our edge cluster nodes support up to 50,000 transactions per second (TPS) with the Zero-Downtime Sync Worker." },
    { q: "Does the mission control support Oracle and SQL Server?", a: "Yes. The Mission Control Orchestrator provides real-time telemetry and parity auditing for all supported source engines, including MySQL, Oracle, and MSSQL." },
    { q: "Is PII masking applied on-the-fly during streaming?", a: "Yes. All data stream buffers are intercepted by the Staging Synthesis layer to apply FakerPHP-based obfuscation before reaching the target sink." },
    { q: "How do I perform a final cutover?", a: "Navigate to the Orchestrator cockpit. Once data parity reaches 100%, hit the 'Final Enterprise Cutover' button to atomize the transition and switch your application's primary connection." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head>
        <title>Engineering Support | SQL STREAM</title>
        <meta name="description" content="Access priority technical support for the SQL STREAM database migration ecosystem. 24/7 developer concierge, architectural reviews, and technical FAQs." />
      </Head>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
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
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Concierge Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/status">
            <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9">Network Health</Button>
          </Link>
        </div>
      </nav>

      <main className="container max-w-5xl mx-auto px-4 pt-32 pb-20 relative z-10">
        <section className="text-center mb-24 space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              24/7 Core Engineering Support
            </Badge>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none mb-8 italic">Priority Access<span className="text-primary">.</span></h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Navigating a high-uptime database migration? Our architects and community are here to provide deep-tier technical guidance.</p>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: <MessageCircle />, title: 'Developer Discord', desc: 'Real-time peer reviews and help from 3,000+ engineers.', action: 'Join Server', color: 'text-indigo-400' },
            { icon: <Github />, title: 'Core Issues', desc: 'Contribute to the transpiler logic and report logic bugs.', action: 'Open Tracker', color: 'text-white' },
            { icon: <Shield />, title: 'Enterprise SLA', desc: 'On-demand migration consulting for mission-critical clusters.', action: 'Contact Sales', color: 'text-primary' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card rounded-[3rem] p-10 border-white/10 hover:border-primary/30 transition-all flex flex-col items-center text-center gap-6 group shadow-2xl relative overflow-hidden">
                <div className={`p-5 bg-white/5 rounded-[1.8rem] group-hover:bg-primary/10 transition-colors ${item.color}`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-7 w-7" })}
                </div>
                <div className="space-y-2">
                   <h3 className="font-black text-xl tracking-tight">{item.title}</h3>
                   <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                </div>
                <Button variant="outline" className="w-full flex items-center justify-center rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 h-12 mt-2">
                  {item.action}
                  <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <section id="sponsorship" className="mb-24 scroll-mt-32">
          <Card className="bg-gradient-to-br from-amber-900/40 via-background to-background rounded-[4rem] p-16 border border-white/10 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[140px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="flex flex-col lg:flex-row items-center gap-20 relative z-10">
              <div className="flex-1 space-y-8">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-5 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest">
                  Fuel the Innovation
                </Badge>
                <h2 className="text-6xl font-black tracking-tighter leading-none italic">Sustain the <span className="text-amber-500">Stream.</span></h2>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                  SQL STREAM is an open-source movement. Your sponsorship directly funds the development of the Neural Engine and maintains our global low-latency stream nodes.
                </p>
                <div className="flex flex-wrap gap-5 pt-4">
                  <Button className="rounded-2xl px-12 h-16 bg-amber-500 hover:bg-amber-600 font-black uppercase text-[10px] tracking-widest text-black shadow-2xl shadow-amber-500/30 transition-all active:scale-95">
                    Github Sponsors
                  </Button>
                  <Button variant="outline" className="rounded-2xl px-12 h-16 border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all active:scale-95">
                    Become a Partner
                  </Button>
                </div>
              </div>

              <div className="w-full lg:w-[400px] grid grid-cols-2 gap-6">
                {[
                  { label: 'Edge Nodes', val: 'Global', icon: <Activity /> },
                  { label: 'Neural Logic', val: 'Active', icon: <Cpu /> },
                  { label: 'Safe Buffers', val: 'AES-256', icon: <Shield /> },
                  { label: 'Sponsors', val: 'Join Us', icon: <Zap /> },
                ].map((stat, i) => (
                  <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 space-y-4 hover:bg-white/[0.06] transition-colors group">
                    <div className="text-primary/40 group-hover:text-primary transition-colors">
                       {React.cloneElement(stat.icon as React.ReactElement<any>, { className: "h-5 w-5" })}
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{stat.label}</p>
                      <p className="font-black text-xl tracking-tight">{stat.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <section className="space-y-10">
            <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4 italic underline decoration-primary/20 underline-offset-8">
              <HelpCircle className="text-primary h-9 w-9" />
              Technical FAQ
            </h2>
            <div className="space-y-6">
              {faqs.map((f, i) => (
                <Card key={i} className="glass-card border-white/5 p-8 rounded-[2.5rem] hover:border-white/20 transition-all shadow-xl group">
                  <h4 className="font-black text-sm mb-4 tracking-tight group-hover:text-primary transition-colors">{f.q}</h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed font-medium opacity-80">{f.a}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4 italic underline decoration-primary/20 underline-offset-8">
              <Send className="text-primary h-9 w-9" />
              Engineering Ticket
            </h2>
            <Card className="glass-card border-primary/20 rounded-[3.5rem] p-12 overflow-hidden relative shadow-2xl">
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
              <div className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <h4 className="font-black text-2xl tracking-tighter">Submit a Stream Inquiry</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Architectural Support Tier 1</p>
                </div>
                <div className="space-y-6">
                  <div className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 flex items-center text-xs font-black uppercase tracking-tight opacity-40 italic">Namespace ID / Host</div>
                  <div className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl px-6 flex items-center text-xs font-black uppercase tracking-tight opacity-40 italic">Engineering Email</div>
                  <div className="h-44 bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-xs font-black uppercase tracking-tight opacity-40 italic leading-relaxed">Briefly describe the structural complexity of your database migration legacy patterns...</div>
                </div>
                <Button className="w-full rounded-2xl h-16 bg-primary font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_20px_50px_rgba(var(--primary),0.3)] transition-all active:scale-95">
                  Launch Request
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </main>

      <footer className="mt-24 py-12 border-t border-white/5 text-center text-[10px] font-black uppercase tracking-[0.4em] opacity-20">
        © 2026 SQL STREAM INFRASTRUCTURE • GLOBAL SUPPORT CLUSTER 
      </footer>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(40px); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>
    </div>
  );
};

export default Support;
