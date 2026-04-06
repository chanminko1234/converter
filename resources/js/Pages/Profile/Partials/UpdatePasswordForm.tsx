import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { Shield, Key, RefreshCw, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put('/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={`${className} space-y-8`}>
            <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">
                    Access Key Rotation
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-relaxed">
                    Rotate your encryption keys regularly to maintain node integrity.
                </p>
            </div>

            <form onSubmit={updatePassword} className="mt-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">Current Access Key</label>
                    <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            type="password"
                            className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                            placeholder="••••••••••••"
                        />
                    </div>
                    {errors.current_password && <p className="text-[10px] font-bold text-red-500 px-1">{errors.current_password}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">New Access Key</label>
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                        <input
                            id="password"
                            ref={passwordInput}
                            type="password"
                            className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            placeholder="••••••••••••"
                        />
                    </div>
                    {errors.password && <p className="text-[10px] font-bold text-red-500 px-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">Confirm New Key</label>
                    <div className="relative group">
                        <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                        <input
                            id="password_confirmation"
                            type="password"
                            className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            placeholder="••••••••••••"
                        />
                    </div>
                    {errors.password_confirmation && <p className="text-[10px] font-bold text-red-500 px-1">{errors.password_confirmation}</p>}
                </div>

                <div className="flex items-center gap-6 pt-4">
                    <Button
                        disabled={processing}
                        className="bg-primary flex hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Rotate Keys
                    </Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-x-2"
                        enterTo="opacity-100 translate-x-0"
                        leave="transition ease-in duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-[9px]">
                            <CheckCircle2 className="w-4 h-4" />
                            Security Updated
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
