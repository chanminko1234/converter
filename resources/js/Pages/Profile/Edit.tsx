import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { motion } from 'framer-motion';
import { User, ShieldAlert, Key } from 'lucide-react';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 group hover:rotate-6 transition-transform">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Node Configuration</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">System Identity and Security Protocols</p>
                    </div>
                </div>
            }
        >
            <Head title="Profile Configuration" />

            <div className="py-12 relative overflow-hidden">
                {/* Background Effects */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
                    <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
                    <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="mx-auto max-w-7xl space-y-8 sm:px-6 lg:px-8 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="glass-card p-1 shadow-2xl sm:rounded-[2.5rem] border border-foreground/10 dark:border-white/10 overflow-hidden"
                    >
                        <div className="bg-background/40 backdrop-blur-3xl p-6 sm:p-10 sm:rounded-[2.4rem]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Identity Parameters</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Core User Information Protocol</p>
                                </div>
                            </div>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-2xl"
                            />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="glass-card p-1 shadow-2xl sm:rounded-[2.5rem] border border-foreground/10 dark:border-white/10 overflow-hidden"
                    >
                        <div className="bg-background/40 backdrop-blur-3xl p-6 sm:p-10 sm:rounded-[2.4rem]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                    <Key className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Access Key Rotation</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Security Credential Update Protocol</p>
                                </div>
                            </div>
                            <UpdatePasswordForm className="max-w-2xl" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="glass-card p-1 shadow-2xl sm:rounded-[2.5rem] border border-red-500/10 dark:border-red-500/10 overflow-hidden"
                    >
                        <div className="bg-red-500/[0.02] backdrop-blur-3xl p-6 sm:p-10 sm:rounded-[2.4rem]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Node Termination</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Danger Zone: Permanent Account Deletion</p>
                                </div>
                            </div>
                            <DeleteUserForm className="max-w-2xl" />
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .glass-card { background: hsla(var(--card), 0.4); backdrop-filter: blur(40px); }
                .bg-grid { background-image: radial-gradient(hsla(var(--foreground), 0.05) 1px, transparent 1px); background-size: 40px 40px; }
            `}</style>
        </AuthenticatedLayout>
    );
}
