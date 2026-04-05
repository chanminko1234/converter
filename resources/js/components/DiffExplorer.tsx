import React, { useRef, useEffect, useState } from 'react';
import { diffLines, Change } from 'diff';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Database, Zap, ArrowRight, Activity, Search } from 'lucide-react';

interface DiffExplorerProps {
  oldCode: string;
  newCode: string;
}

export const DiffExplorer: React.FC<DiffExplorerProps> = ({ oldCode, newCode }) => {
  const [diffParts, setDiffParts] = useState<Change[]>([]);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync scrolling
    const left = leftRef.current;
    const right = rightRef.current;

    const handleLeftScroll = () => { if (right && left) right.scrollTop = left.scrollTop; };
    const handleRightScroll = () => { if (left && right) left.scrollTop = right.scrollTop; };

    left?.addEventListener('scroll', handleLeftScroll);
    right?.addEventListener('scroll', handleRightScroll);

    return () => {
      left?.removeEventListener('scroll', handleLeftScroll);
      right?.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  useEffect(() => {
    if (oldCode && newCode) {
        setDiffParts(diffLines(oldCode, newCode));
    }
  }, [oldCode, newCode]);

  if (!oldCode || !newCode) {
      return (
        <div className="h-full flex flex-col items-center justify-center opacity-20 p-20 text-center gap-4 bg-[#0d1117]/50 rounded-3xl border border-white/5">
          <Search className="h-16 w-16 mb-4" />
          <p className="font-bold text-sm uppercase tracking-[0.2em]">Generate SQL to view structural Delta</p>
        </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:block">
          <div className="bg-primary/20 backdrop-blur-xl p-3 rounded-full border border-primary/40 shadow-[0_0_50px_rgba(109,40,217,0.5)] flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
          </div>
      </div>

      {/* HEADER */}
      <div className="grid grid-cols-2 border-b border-white/5 bg-white/[0.02]">
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-r border-white/5">
          <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-xl">
                <Database className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">MySQL Source</span>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-3">
           <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-xl">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">PostgreSQL Target</span>
           </div>
           <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
              <Activity className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Live Diff</span>
           </div>
        </div>
      </div>

      {/* DIFF DISPLAY */}
      <div className="flex-1 overflow-hidden grid grid-cols-2 relative bg-[#0d1117]">
        {/* LEFT COLUMN: MySQL */}
        <div 
          ref={leftRef} 
          className="overflow-auto border-r border-white/5 custom-scrollbar"
        >
          <div className="p-6">
             {diffParts.map((part, i) => {
                 if (part.added) return null;
                 return (
                    <div key={i} className={`${part.removed ? 'bg-red-500/10 border-l-2 border-red-500 animate-in fade-in slide-in-from-left-2 duration-500' : 'opacity-40'} whitespace-pre-wrap font-mono text-[12px] leading-relaxed px-3 py-1 rounded-sm mb-1`}>
                        <SyntaxHighlighter
                            language="sql"
                            style={vscDarkPlus}
                            customStyle={{ background: 'transparent', padding: 0, margin: 0, fontSize: 'inherit' }}
                        >
                            {part.value}
                        </SyntaxHighlighter>
                    </div>
                 );
             })}
          </div>
        </div>

        {/* RIGHT COLUMN: PostgreSQL */}
        <div 
          ref={rightRef} 
          className="overflow-auto custom-scrollbar"
        >
          <div className="p-6">
            {diffParts.map((part, i) => {
                 if (part.removed) return null;
                 return (
                    <div key={i} className={`${part.added ? 'bg-green-500/10 border-l-2 border-green-500 animate-in fade-in slide-in-from-right-2 duration-500' : 'opacity-40'} whitespace-pre-wrap font-mono text-[12px] leading-relaxed px-3 py-1 rounded-sm mb-1`}>
                        <SyntaxHighlighter
                            language="sql"
                            style={vscDarkPlus}
                            customStyle={{ background: 'transparent', padding: 0, margin: 0, fontSize: 'inherit' }}
                        >
                            {part.value}
                        </SyntaxHighlighter>
                    </div>
                 );
             })}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
};
