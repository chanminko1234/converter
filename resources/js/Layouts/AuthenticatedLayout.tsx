import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import {
    LayoutDashboard, Zap, ShieldCheck, User, LogOut, ChevronDown, 
    Menu as MenuIcon, X, BrainCircuit, LifeBuoy, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/Components/ui/button';
import { ThemeToggle } from '@/Components/ThemeToggle';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.03] dark:opacity-[0.07]" />
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation Command Center */}
            <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-foreground/5 dark:border-white/5">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 group-hover:rotate-12 transition-transform">
                                    <Zap className="w-5 h-5 text-primary" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-sm font-black tracking-tighter text-foreground uppercase">Core Node</h1>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">SQL Stream Engine</p>
                                </div>
                            </Link>

                            <div className="hidden space-x-1 lg:flex items-center">
                                <Link href="/dashboard">
                                    <Button variant="ghost" className={`rounded-full px-4 flex font-black text-[10px] uppercase tracking-widest transition-all ${window.location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                                        <LayoutDashboard className="w-3 h-3 mr-2" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/orchestrator">
                                    <Button variant="ghost" className={`rounded-full flex px-4 font-black text-[10px] uppercase tracking-widest transition-all ${window.location.pathname === '/orchestrator' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                                        <Zap className="w-3 h-3 mr-2" />
                                        Orchestrator
                                    </Button>
                                </Link>
                                <Link href="/index-advisor">
                                    <Button variant="ghost" className={`rounded-full flex px-4 font-black text-[10px] uppercase tracking-widest transition-all ${window.location.pathname === '/index-advisor' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                                        <BrainCircuit className="w-3 h-3 mr-2" />
                                        Advisor
                                    </Button>
                                </Link>
                                <Link href="/validation">
                                    <Button variant="ghost" className={`rounded-full flex px-4 font-black text-[10px] uppercase tracking-widest transition-all ${window.location.pathname === '/validation' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                                        <ShieldCheck className="w-3 h-3 mr-2" />
                                        Validation
                                    </Button>
                                </Link>
                                <div className="h-4 w-[1px] bg-foreground/10 mx-2" />
                                <Link href="/docs">
                                    <Button variant="ghost" className={`rounded-full flex px-4 font-black text-[10px] uppercase tracking-widest transition-all ${window.location.pathname === '/docs' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                                        <FileText className="w-3 h-3 mr-2" />
                                        Docs
                                    </Button>
                                </Link>
                                <Link href="/support">
                                    <Button variant="ghost" className={`rounded-full flex px-4 font-black text-[10px] uppercase tracking-widest transition-all ${window.location.pathname === '/support' ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                                        <LifeBuoy className="w-3 h-3 mr-2" />
                                        Support
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center gap-4">
                            <ThemeToggle />

                            <div className="h-6 w-[1px] bg-foreground/10" />

                            {user ? (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all outline-none">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="text-left hidden md:block">
                                                <p className="text-[10px] font-black uppercase tracking-tighter text-foreground leading-tight">{user.name}</p>
                                                <p className="text-[8px] font-bold text-primary/60 uppercase tracking-widest">Active Node</p>
                                            </div>
                                            <ChevronDown className="w-3 h-3 text-foreground/40" />
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-2 bg-background/95 backdrop-blur-3xl border border-foreground/10 shadow-2xl rounded-2xl min-w-[200px] mt-2">
                                        <div className="px-4 py-3 mb-2 border-b border-foreground/5">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">System Identity</p>
                                            <p className="text-[11px] font-bold truncate text-foreground/80">{user.email}</p>
                                        </div>

                                        <Dropdown.Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all">
                                            <User className="w-3.5 h-3.5" />
                                            Node Configuration
                                        </Dropdown.Link>

                                        <Dropdown.Link href="/logout" method="post" as="button" className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-red-500 hover:bg-red-500/5 transition-all">
                                            <LogOut className="w-3.5 h-3.5" />
                                            Terminate Session
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link href="/login">
                                        <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-4 h-9 text-foreground/70 dark:text-foreground/40 hover:text-foreground transition-colors">Sign In</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button className="rounded-full font-black text-[10px] px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground ring-1 ring-foreground/20">Join Port</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 sm:hidden">
                            <ThemeToggle />
                            <button
                                onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                                className="p-2 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground"
                            >
                                {showingNavigationDropdown ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showingNavigationDropdown && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:hidden border-t border-foreground/5 bg-background overflow-hidden"
                        >
                            <div className="p-4 space-y-2">
                                <Link href="/overview">
                                    <Button variant="ghost" className="w-full justify-start rounded-xl py-6 font-black text-xs uppercase tracking-widest text-foreground/70">
                                        <LayoutDashboard className="w-4 h-4 mr-3" />
                                        Overview
                                    </Button>
                                </Link>
                                <Link href="/orchestrator">
                                    <Button variant="ghost" className="w-full justify-start rounded-xl py-6 font-black text-xs uppercase tracking-widest text-foreground/70">
                                        <Zap className="w-4 h-4 mr-3" />
                                        Orchestrator
                                    </Button>
                                </Link>
                                 <div className="pt-4 mt-4 border-t border-foreground/5">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3 px-4 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-foreground">{user.name}</p>
                                                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{user.email}</p>
                                                </div>
                                            </div>
                                            <Link href="/profile">
                                                <Button variant="ghost" className="w-full justify-start rounded-xl py-6 font-black text-xs uppercase tracking-widest text-foreground/70">
                                                    <User className="w-4 h-4 mr-3" />
                                                    Configuration
                                                </Button>
                                            </Link>
                                            <Link href="/logout" method="post" as="button" className="w-full">
                                                <Button variant="ghost" className="w-full justify-start rounded-xl py-6 font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/5">
                                                    <LogOut className="w-4 h-4 mr-3" />
                                                    Terminate
                                                </Button>
                                            </Link>
                                        </>
                                    ) : (
                                        <div className="px-2 space-y-2">
                                            <Link href="/login">
                                                <Button variant="ghost" className="w-full justify-start rounded-xl py-6 font-black text-xs uppercase tracking-widest text-foreground/70">Sign In</Button>
                                            </Link>
                                            <Link href="/register">
                                                <Button className="w-full justify-start rounded-xl py-6 font-black text-xs uppercase tracking-widest bg-primary text-primary-foreground">Join Port</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Context Header */}
            {header && (
                <header className="relative z-10 scroll-mt-20">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* Main Operational Area */}
            <main className="relative z-10 pb-20">
                {children}
            </main>

            <style>{`
                .bg-grid { background-image: radial-gradient(hsla(var(--foreground), 0.05) 1px, transparent 1px); background-size: 40px 40px; }
            `}</style>
        </div>
    );
}
