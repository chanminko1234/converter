import Modal from '@/components/Modal';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Trash2, AlertTriangle, XCircle, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy('/profile', {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`${className} space-y-6`}>
            <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-red-500/80">
                    Irreversible Termination
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/40 leading-relaxed">
                    Once the node is terminated, all associated data and resources will be permanently decommissioned.
                </p>
            </div>

            <Button
                onClick={confirmUserDeletion}
                className="bg-red-500/10 flex hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-8 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-red-500/5 transition-all active:scale-[0.98] group"
            >
                <Trash2 className="w-3.5 h-3.5 mr-2 group-hover:animate-bounce" />
                Initiate Decommissioning
            </Button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-8 bg-slate-950 border border-red-500/20 rounded-[2rem] overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white uppercase">Critical Confirmation Required</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Node Termination Protocol Active</p>
                        </div>
                    </div>

                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-8">
                        This action is idempotent and final. All infrastructure associated with this identity will be purged. Please enter your primary access key to confirm terminal decommission.
                    </p>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-red-500/60 px-1">Primary Access Key</label>
                        <div className="relative group">
                            <ShieldX className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/20 group-focus-within:text-red-500 transition-colors" />
                            <input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full bg-red-500/5 border border-red-500/10 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white transition-all outline-none"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>
                        {errors.password && <p className="text-[10px] font-bold text-red-500 px-1">{errors.password}</p>}
                    </div>

                    <div className="mt-10 flex gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeModal}
                            className="flex-1 rounded-2xl font-black text-[10px] h-12 uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <XCircle className="w-3.5 h-3.5 mr-2" />
                            Abort
                        </Button>

                        <Button
                            disabled={processing}
                            className="flex-[2] bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] h-12 uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all active:scale-[0.98]"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Confirm Termination
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
