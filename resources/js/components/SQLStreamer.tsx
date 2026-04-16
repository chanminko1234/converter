import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { Play, Square, Activity, Database, Table as TableIcon, Terminal, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StreamingDataTable } from './StreamingDataTable';

interface SQLStreamerProps {
  initialQuery?: string;
  sourceType?: string;
  connectionConfig?: any;
}

export const SQLStreamer: React.FC<SQLStreamerProps> = ({
  initialQuery = 'SELECT * FROM users LIMIT 100',
  sourceType = 'mysql',
  connectionConfig = {}
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState({ totalRows: 0, startTime: 0, rowsPerSec: 0 });
  const [status, setStatus] = useState<'idle' | 'connecting' | 'streaming' | 'completed' | 'error'>('idle');
  const [columns, setColumns] = useState<string[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stopStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setStatus('idle');
    toast.error('Protocol Terminated: Stream closed by operator.');
  };

  const startStream = () => {
    if (isStreaming) return;

    // Cleanup previous connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setRows([]);
    setColumns([]);
    setIsStreaming(true);
    setStatus('connecting');
    setStats({ totalRows: 0, startTime: Date.now(), rowsPerSec: 0 });

    const params = new URLSearchParams({
      sql: query,
      source_type: sourceType,
      ...Object.keys(connectionConfig).reduce((acc: any, key) => {
        acc[`source[${key}]`] = connectionConfig[key];
        return acc;
      }, {})
    });

    const url = `/convert/stream-results?${params.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('meta', (event: any) => {
      const data = JSON.parse(event.data);
      setStatus('streaming');
      toast.info('Connected to database engine.');
    });

    es.addEventListener('row', (event: any) => {
      const row = JSON.parse(event.data);

      setRows((prev) => {
        const next = [row, ...prev].slice(0, 500); // Keep last 500 for performance
        if (prev.length === 0 && row) {
          setColumns(Object.keys(row));
        }
        return next;
      });

      setStats((prev) => {
        const total = prev.totalRows + 1;
        const elapsed = (Date.now() - prev.startTime) / 1000;
        return {
          ...prev,
          totalRows: total,
          rowsPerSec: Math.round(total / (elapsed || 1))
        };
      });
    });

    es.addEventListener('done', (event: any) => {
      setStatus('completed');
      setIsStreaming(false);
      es.close();
      toast.success('Streaming protocol completed successfully.');
    });

    es.addEventListener('error', (event: any) => {
      setStatus('error');
      setIsStreaming(false);
      es.close();

      try {
        const error = JSON.parse(event.data);
        toast.error(error.message || 'Streaming failed.');
      } catch {
        toast.error('Lost connection to stream.');
      }
    });
  };


  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-background/50 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-xl font-bold tracking-tight">SQL Live Streamer</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={status === 'streaming' ? 'default' : 'secondary'} className="px-3 py-1">
              {status.toUpperCase()}
            </Badge>
            {isStreaming && (
              <span className="flex h-3 w-3 rounded-full bg-green-500 animate-ping" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="relative w-full h-32 p-4 bg-muted/80 border-none rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                placeholder="Enter SQL Query..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                {!isStreaming ? (
                  <Button
                    onClick={startStream}
                    className="rounded-2xl flex justify-center items-center h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_15px_40px_rgba(var(--primary),0.3)] group"
                  >
                    <Play className="w-4 h-4 mr-3 fill-current group-hover:scale-110 transition-transform" /> Start Protocol
                  </Button>
                ) : (
                  <Button
                    onClick={stopStream}
                    variant="destructive"
                    className="rounded-2xl flex justify-center items-center h-14 px-8 font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-[0_15px_40px_rgba(239,68,68,0.3)] animate-pulse"
                  >
                    <Square className="w-4 h-4 mr-3 fill-current" /> Stop Stream
                  </Button>
                )}

                <Button
                  onClick={() => { setRows([]); setColumns([]); }}
                  variant="outline"
                  className="rounded-2xl h-14 px-8 border-foreground/10 text-foreground/60 font-black uppercase text-[11px] tracking-widest hover:bg-foreground/5 transition-all"
                >
                  Clear Buffer
                </Button>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mr-4">
                <div className="flex items-center">
                  <TableIcon className="mr-1 h-4 w-4" />
                  <span className="font-bold text-foreground mx-1">{stats.totalRows}</span> rows
                </div>
                <div className="flex items-center ml-4">
                  <Activity className="mr-1 h-4 w-4" />
                  <span className="font-bold text-foreground mx-1">{stats.rowsPerSec}</span> r/s
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StreamingDataTable
        rows={rows}
        columns={columns}
        isStreaming={isStreaming}
      />

      {isStreaming && (
        <Progress value={Math.min(100, stats.rowsPerSec)} className="h-1 animate-pulse" />
      )}
    </div>
  );
};

export default SQLStreamer;
