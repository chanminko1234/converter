import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { User, Mail, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch('/profile');
    };

    return (
        <section className={`${className} space-y-8`}>
            <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">
                    Identity Parameters
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-relaxed">
                    Update your node's identity classification and communication endpoint.
                </p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">Legal Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                        <input
                            id="name"
                            className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Engineering Admin"
                        />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-red-500 px-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 dark:text-foreground/30 px-1">Node Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                        <input
                            id="email"
                            type="email"
                            className="w-full bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground transition-all outline-none"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="name@node.internal"
                        />
                    </div>
                    {errors.email && <p className="text-[10px] font-bold text-red-500 px-1">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">
                            Endpoint verification required.
                            <Link
                                href="/email/verification-notification"
                                method="post"
                                as="button"
                                className="block mt-1 text-[9px] font-black underline hover:text-amber-600 transition-colors"
                            >
                                Re-dispatch verification protocol.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-[10px] font-bold text-emerald-500 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" />
                                Protocol dispatched to endpoint.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-6 pt-4">
                    <Button
                        disabled={processing}
                        className="bg-primary flex hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Commit Changes
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
                            Identity Updated
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
