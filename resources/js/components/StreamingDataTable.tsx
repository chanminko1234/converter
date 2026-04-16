import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, ChevronDown, Filter, FileSpreadsheet, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StreamingDataTableProps {
  rows: any[];
  columns: string[];
  isStreaming: boolean;
  className?: string;
}

export const StreamingDataTable: React.FC<StreamingDataTableProps> = ({
  rows,
  columns,
  isStreaming,
  className
}) => {
  const csvData = useMemo(() => {
    if (rows.length === 0) return '';
    const header = columns.join(',');
    const body = rows.map(row =>
      columns.map(col => {
        const val = row[col];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    ).join('\n');
    return `${header}\n${body}`;
  }, [rows, columns]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(csvData);
    toast.success('Formatted CSV copied to clipboard');
  }, [csvData]);

  const downloadCsv = useCallback(() => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sql_stream_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Download initiated');
  }, [csvData]);

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-[2.5rem] bg-muted/5">
        <Box className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-bold tracking-tight">Awaiting Neural Stream Output...</p>
        <p className="text-sm opacity-50">Execute protocol to materialize telemetry rows.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Live Result Set</h4>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 flex rounded-xl px-3 text-[10px] font-black uppercase tracking-widest bg-background/50 border-foreground/5"
          >
            <Copy className="w-3 h-3 mr-2" /> Copy CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            className="h-8 flex rounded-xl px-3 text-[10px] font-black uppercase tracking-widest bg-background/50 border-foreground/5"
          >
            <Download className="w-3 h-3 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="relative rounded-[2.5rem] border border-foreground/5 bg-background/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
        <div className="max-h-[600px] overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-20">
              <tr className="bg-background/90 backdrop-blur-xl border-b border-foreground/5">
                {columns.map((col) => (
                  <th key={col} className="p-5 text-[10px] font-black uppercase tracking-widest text-primary/70">
                    <div className="flex items-center gap-2">
                      {col}
                      <ChevronDown className="w-3 h-3 opacity-30" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="relative">
              <AnimatePresence initial={false}>
                {rows.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      opacity: { duration: 0.2 }
                    }}
                    className={cn(
                      "group border-b border-foreground/[0.03] transition-colors",
                      i === 0 && isStreaming ? "bg-primary/[0.03]" : "hover:bg-foreground/[0.02]"
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col} className="p-5 overflow-hidden">
                        <span className={cn(
                          "block font-mono text-[13px] truncate tracking-tighter group-hover:text-primary transition-colors",
                          typeof row[col] === 'number' ? 'text-amber-500' : 'text-foreground/80'
                        )}>
                          {row[col]?.toString() ?? <span className="opacity-20 italic">null</span>}
                        </span>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary), 0.3);
        }
      `}</style>
    </div>
  );
};
