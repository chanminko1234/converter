import { FormEventHandler } from 'react';
import { PremiumNav } from '@/Components/PremiumNav';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col items-center justify-center">
            <Head title="Forgot Password" />

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
                            <RefreshCw className="w-10 h-10 text-primary animate-spin-slow" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-foreground mb-2">Protocol Recovery</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Initialize Access Key Reset Flow</p>
                    </div>

                    <div className="mb-8 text-xs font-bold text-foreground/60 text-center leading-relaxed px-4">
                        Forgot your password? No problem. Decrypt your access by entering your registered engineering email below.
                    </div>

                    {status && (
                        <div className="mb-6 text-sm font-medium text-emerald-500 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">Registered Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                                    placeholder="your-node@internal.net"
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.email && <p className="text-[10px] font-bold text-red-500 px-1">{errors.email}</p>}
                        </div>

                        <Button 
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                        >
                            {processing ? 'Transmitting Request...' : 'Transmit Recovery Link'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <div className="mt-8 text-center pt-8 border-t border-foreground/10 dark:border-white/10">
                        <Link href="/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest text-[10px]">
                            Back to <span className="text-primary font-black ml-1">Authentication Hub</span>
                        </Link>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .glass { background: hsla(var(--background), 0.8); backdrop-filter: blur(20px); }
                .glass-card { background: hsla(var(--card), 0.4); backdrop-filter: blur(40px); }
                .bg-grid { background-image: radial-gradient(hsla(var(--foreground), 0.05) 1px, transparent 1px); background-size: 40px 40px; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
            `}</style>
        </div>
    );
}
