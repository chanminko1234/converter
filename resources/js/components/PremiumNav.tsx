import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ThemeToggle } from '@/Components/theme-toggle';
import { Rocket } from 'lucide-react';

interface PremiumNavProps {
    active?: 'home' | 'orchestrator' | 'validation' | 'index-advisor' | 'docs' | 'status' | 'support';
}

export const PremiumNav: React.FC<PremiumNavProps> = ({ active }) => {
    const links = [
        { name: 'Migration', href: '/', id: 'home' },
        { name: 'Orchestrator', href: '/orchestrator', id: 'orchestrator' },
        { name: 'Validation', href: '/validation', id: 'validation' },
        { name: 'Index Advisor', href: '/index-advisor', id: 'index-advisor' },
        { name: 'Docs', href: '/docs', id: 'docs' },
        { name: 'Status', href: '/status', id: 'status' },
    ];

    return (
        <nav className="border-b glass fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <Link href="/" className="bg-primary/20 p-2.5 rounded-xl ring-1 ring-primary/30">
                    <Rocket className="h-6 w-6 text-primary fill-primary/20" />
                </Link>
                <div className="flex flex-col text-foreground">
                    <span className="font-black text-xl tracking-tighter leading-none">
                        SQL<span className="text-primary italic">STREAM</span>
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/40 dark:text-foreground/30">Engineering Port</span>
                </div>
            </div>
            
            <div className="flex items-center gap-8">
                <div className="hidden lg:flex items-center gap-6">
                    {links.map((link) => (
                         <Link 
                            key={link.id}
                            href={link.href} 
                            className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${active === link.id ? 'text-primary' : 'text-foreground/40 dark:text-foreground/30 hover:text-foreground active:text-primary transition-colors'}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
                
                <div className="flex items-center gap-4 h-9">
                     <ThemeToggle />
                    <Link href="/support">
                        <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase tracking-widest px-6 border border-foreground/10 dark:border-white/5 h-full text-foreground/70 dark:text-white hover:bg-foreground/5 dark:hover:bg-white/5">Support</Button>
                    </Link>
                </div>
            </div>

             <style>{`
                .glass { background: hsla(var(--background), 0.8); backdrop-filter: blur(20px); }
            `}</style>
        </nav>
    );
};
