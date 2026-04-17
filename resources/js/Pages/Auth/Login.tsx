import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { PremiumNav } from '@/components/PremiumNav';
import { motion } from 'framer-motion';
import { Lock, Mail, Github, Fingerprint, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col items-center justify-center">
            <Head>
                <title>Engineering Login | Port Access</title>
                <meta name="description" content="Authenticate your node identity to gain access to the SQL STREAM infrastructure." />
            </Head>

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
                            <ShieldCheck className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-foreground mb-2">Security Clearance</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Node Identification Architecture v4.0</p>
                    </div>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">Engineering Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                                    placeholder="name@node.internal"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            {errors.email && <p className="text-[10px] font-bold text-red-500 px-1">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30">Protocol Key</label>
                                {canResetPassword && (
                                    <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">Recover</Link>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                                    placeholder="••••••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                            {errors.password && <p className="text-[10px] font-bold text-red-500 px-1">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 transition-all ${data.remember ? 'bg-primary border-primary' : 'bg-foreground/5 border-foreground/10'}`}>
                                        {data.remember && <ShieldCheck className="w-4 h-4 text-white mx-auto" />}
                                    </div>
                                </div>
                                <span className="ms-3 text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 group-hover:text-foreground transition-colors">Keep Session Active</span>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                        >
                            {processing ? 'Decrypting Access...' : 'Initiate Port Entry'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-foreground/10 dark:border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 dark:text-foreground/30 text-center mb-6">Or Authorize via Internal Provider</p>
                        <div className="grid grid-cols-2 gap-4">
                            <a href={route('auth.redirect', { provider: 'github' })} className="w-full">
                                <Button variant="outline" className="w-full rounded-2xl flex justify-center py-6 border-foreground/10 dark:border-white/10 text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-all text-[10px] font-black tracking-widest uppercase">
                                    <Github className="w-4 h-4 mr-2" /> GitHub
                                </Button>
                            </a>
                            <a href={route('auth.redirect', { provider: 'google' })} className="w-full">
                                <Button variant="outline" className="w-full rounded-2xl flex justify-center py-6 border-foreground/10 dark:border-white/10 text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-all text-[10px] font-black tracking-widest uppercase">
                                    <Fingerprint className="w-4 h-4 mr-2" /> SSO
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-bold text-muted-foreground">
                            New to the infrastructure? {' '}
                            <Link href="/register" className="text-primary hover:underline font-black tracking-widest uppercase text-[10px] ml-1">Establish Node</Link>
                        </p>
                    </div>
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
