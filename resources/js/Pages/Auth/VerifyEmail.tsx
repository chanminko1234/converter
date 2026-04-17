import { FormEventHandler } from 'react';
import { PremiumNav } from '@/components/PremiumNav';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/email/verification-notification');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col items-center justify-center">
            <Head>
                <title>Verify Identity | Node Activation</title>
                <meta name="description" content="Complete the verification protocol to activate your node within the global control hub." />
            </Head>

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <PremiumNav />

            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mt-24 w-full overflow-hidden glass-card p-1 shadow-2xl sm:max-w-md sm:rounded-[3rem] border border-foreground/10 dark:border-white/10 relative z-10"
            >
                <div className="bg-background/40 backdrop-blur-3xl px-10 py-12 sm:rounded-[2.8rem]">
                    <div className="mb-10 text-center relative">
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center ring-1 ring-primary/30 rotate-12 group hover:rotate-0 transition-transform">
                            <Mail className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-foreground mb-2">Node Activation</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Verification Protocol Required</p>
                    </div>

                    <div className="mb-8 text-xs font-bold text-foreground/60 text-center leading-relaxed px-4">
                        Thanks for signing up! Before getting started, you must activate your node by clicking the link we just dispatched to your email.
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="mb-6 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            New Link Dispatched to Repository
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <Button 
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                        >
                            {processing ? 'Dispatching...' : 'Resend Activation Link'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <div className="flex justify-center pt-4">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 hover:text-red-500 transition-colors flex items-center gap-2 translate-y-1"
                            >
                                <LogOut className="w-3 h-3" />
                                Terminate Session
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>

            <style>{`
                .glass { background: hsla(var(--background), 0.8); backdrop-filter: blur(20px); }
                .glass-card { background: hsla(var(--card), 0.4); backdrop-filter: blur(40px); }
                .bg-grid { background-image: radial-gradient(hsla(var(--foreground), 0.05) 1px, transparent 1px); background-size: 40px 40px; }
            `}</style>
        </div>
    );
}
