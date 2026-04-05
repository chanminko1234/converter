import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  MessageCircle, HelpCircle,
  Send, Mail, Github, ExternalLink, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const Support: React.FC = () => {
  const faqs = [
    { q: "Is there a file size limit?", a: "Standard uploads support files up to 100MB. For larger databases, please use our CLI tool or streaming endpoint." },
    { q: "How accurate is the transformation?", a: "We maintain a 99.9% accuracy rate for standard SQL. Complex stored procedures may require a manual review." },
    { q: "Does the system scan for sensitive data?", a: "Yes. Our PII Defense Engine auto-detects fields like passwords, SSRNs, and credit cards and applies one-way hashing to obfuscate them before export." },
    { q: "How do I verify the migration?", a: "When transforming to PostgreSQL, the engine automatically generates an 'Integrity Validation Script' containing queries to verify row counts, sum totals, and foreign keys." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      <Head>
        <title>Technical Support | MySQL to PostgreSQL Converter</title>
        <meta name="description" content="Get expert technical support and guidance on complex database migrations from MySQL to PostgreSQL. Community hub, bug tracker, and detailed FAQs." />
        <meta name="keywords" content="sql migration support, database conversion help, mysql to postgresql technical assistance, troubleshoot sql migration" />
      </Head>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <nav className="border-b glass fixed top-0 w-full z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20">
            <Zap className="h-6 w-6 text-primary fill-primary/20" />
          </Link>
          <span className="font-bold text-xl tracking-tight">
            Converter<span className="text-primary text-2xl">.</span>Support
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/status">
            <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-white/5 h-9">System Status</Button>
          </Link>
        </div>
      </nav>

      <main className="container max-w-5xl mx-auto px-4 pt-32 pb-20 relative z-10">
        <section className="text-center mb-20 space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Badge variant="outline" className="px-5 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              24/7 Developer Concierge
            </Badge>
            <h1 className="text-6xl font-black tracking-tight leading-none mb-6">Expert Assistance<span className="text-primary">.</span></h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Looking for help with a complex migration? Our engineering team and community are here to guide you.</p>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: <MessageCircle />, title: 'Community Discord', desc: 'Real-time help from 2,500+ developers.', action: 'Join Server', color: 'text-indigo-400' },
            { icon: <Github />, title: 'Bug Tracker', desc: 'Open a technical issue on our GitHub.', action: 'Open Issue', color: 'text-white' },
            { icon: <Mail />, title: 'Enterprise Support', desc: 'Priority assistance for large migrations.', action: 'Contact Sales', color: 'text-primary' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card rounded-[2.5rem] p-8 border-white/10 hover:border-primary/20 transition-all flex flex-col items-center text-center gap-4 group">
                <div className={`p-4 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors ${item.color}`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: "h-6 w-6" })}
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                <Button variant="outline" className="w-full flex items-center justify-center rounded-xl border-white/5 font-bold hover:bg-white/5 text-xs mt-2">
                  {item.action}
                  <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <section id="donation" className="mb-20 scroll-mt-32">
          <Card className="bg-gradient-to-br from-amber-900/40 via-background to-background rounded-[3rem] p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="flex-1 space-y-6">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1 rounded-full text-[10px] uppercase font-black tracking-widest">
                  Back the Innovation
                </Badge>
                <h2 className="text-5xl font-black tracking-tight leading-none">Support our <span className="text-amber-500">Mission.</span></h2>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                  SQL Decoded is built by independent developers dedicated to simplifying data transformation. Your support helps us maintain the engine and keep our tools free for the community.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button className="rounded-2xl px-10 h-14 bg-amber-500 hover:bg-amber-600 font-black uppercase text-[10px] tracking-widest text-black shadow-2xl shadow-amber-500/20">
                    Buy us a coffee
                  </Button>
                  <Button variant="outline" className="rounded-2xl px-10 h-14 border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5">
                    Become a Sponsor
                  </Button>
                </div>
              </div>

              <div className="w-full lg:w-96 grid grid-cols-2 gap-4">
                {[
                  { label: 'Cloud Hosting', val: '$120/mo', active: true },
                  { label: 'Compute Power', val: 'Turbo', active: true },
                  { label: 'Dev Pipeline', val: 'Automated', active: true },
                  { label: 'Community', val: 'Infinite', active: true },
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <p className="font-bold text-lg">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <HelpCircle className="text-primary h-8 w-8" />
              Frequently Asked
            </h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <Card key={i} className="glass border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all">
                  <h4 className="font-bold text-sm mb-2">{f.q}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{f.a}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Send className="text-primary h-8 w-8" />
              Direct Support
            </h2>
            <Card className="glass-card border-primary/20 rounded-[2.5rem] p-10 overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
              <div className="space-y-6 relative z-10">
                <div className="space-y-1">
                  <h4 className="font-bold text-xl">Submit a Request</h4>
                  <p className="text-xs text-muted-foreground">Typical response time: 2-4 hours</p>
                </div>
                <div className="space-y-4">
                  <div className="h-10 bg-white/5 border border-white/5 rounded-xl px-4 flex items-center text-xs opacity-50 italic">Full Name...</div>
                  <div className="h-10 bg-white/5 border border-white/5 rounded-xl px-4 flex items-center text-xs opacity-50 italic">Professional Email...</div>
                  <div className="h-32 bg-white/5 border border-white/5 rounded-xl p-4 text-xs opacity-50 italic leading-relaxed">Briefly describe your database transformation requirements and any critical blockers...</div>
                </div>
                <Button className="w-full rounded-2xl h-12 bg-primary font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-primary/30">
                  Send Inquiry
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </main>

      <footer className="mt-20 py-10 border-t border-white/5 text-center text-[10px] font-black uppercase tracking-widest opacity-30">
        © 2026 SQL Decoded • Global Support Tier 1
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
