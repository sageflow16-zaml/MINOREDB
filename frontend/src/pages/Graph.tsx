import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useKnowledgeGraphData } from '../hooks/useResearchV3';
import { Skeleton } from '../components/ui/skeleton';
import { ErrorState } from '../components/ui/Feedback';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { ZoomIn, ZoomOut, Maximize, Search, Network, Move, Layers } from 'lucide-react';

interface SimNode {
  id: string; name: string; type: string; category?: string; color?: string; summary?: string;
  x: number; y: number; vx: number; vy: number; r: number;
  connections: number; pinned: boolean;
}
interface SimEdge {
  id: string; source: string; target: string; relationship: string; strength: number;
}
interface GraphNode { id: string; name: string; type: string; category?: string; color?: string; summary?: string; }
interface GraphEdge { id: string; source: string; target: string; relationship: string; strength: number; }

const NODE_COLORS: Record<string, string> = {
  concept: 'hsl(var(--chart-2))', document: 'hsl(var(--chart-5))', rule: 'hsl(var(--warning))',
  pattern: 'hsl(var(--chart-4))', strategy: 'hsl(var(--chart-3))', psychology: 'hsl(var(--chart-1))',
  risk: 'hsl(var(--destructive))', journal: 'hsl(var(--chart-5))', book: 'hsl(var(--chart-3))',
};

export default function GraphPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: graphData, isLoading, isError, error, refetch } = useKnowledgeGraphData(projectId!);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const simRef = useRef<SimNode[]>([]);
  const edgeRef = useRef<SimEdge[]>([]);
  const dragRef = useRef<{ node: SimNode | null; ox: number; oy: number }>({ node: null, ox: 0, oy: 0 });

  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const W = 800, H = 600;

  const initSim = useCallback((nodes: GraphNode[], edges: GraphEdge[]) => {
    const simNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const r = Math.min(W, H) * 0.35;
      const connections = edges.filter(e => e.source === n.id || e.target === n.id).length;
      return {
        ...n, x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle),
        vx: 0, vy: 0, r: 8 + Math.min(connections, 10) * 2.5,
        connections, pinned: false,
      };
    });
    const simEdges: SimEdge[] = edges.map(e => ({ ...e }));
    simRef.current = simNodes;
    edgeRef.current = simEdges;
  }, []);

  useEffect(() => {
    if (graphData?.nodes && graphData?.edges) {
      initSim(graphData.nodes, graphData.edges);
    }
  }, [graphData, initSim]);

  useEffect(() => {
    if (!canvasRef.current || simRef.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const simTick = () => {
      if (!running) return;
      const nodes = simRef.current;
      const edges = edgeRef.current;
      if (nodes.length === 0) { animRef.current = requestAnimationFrame(simTick); return; }

      const repulsion = 8000;
      const attraction = 0.005;
      const damping = 0.85;
      const centerForce = 0.01;

      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].pinned) continue;
        const nx = nodes[i].x + pan.x;
        const ny = nodes[i].y + pan.y;
        nodes[i].vx += (W / 2 - nx) * centerForce;
        nodes[i].vy += (H / 2 - ny) * centerForce;
        nodes[i].vx *= damping;
        nodes[i].vy *= damping;
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].pinned && nodes[j].pinned) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!nodes[i].pinned) { nodes[i].vx += fx; nodes[i].vy += fy; }
          if (!nodes[j].pinned) { nodes[j].vx -= fx; nodes[j].vy -= fy; }
        }
      }

      for (const edge of edges) {
        const s = nodes.find(n => n.id === edge.source);
        const t = nodes.find(n => n.id === edge.target);
        if (!s || !t || (s.pinned && t.pinned)) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * attraction * edge.strength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!s.pinned) { s.vx += fx; s.vy += fy; }
        if (!t.pinned) { t.vx -= fx; t.vy -= fy; }
      }

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'hsl(var(--muted))';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Edges
      for (const edge of edges) {
        const s = nodes.find(n => n.id === edge.source);
        const t = nodes.find(n => n.id === edge.target);
        if (!s || !t) continue;
        ctx.strokeStyle = `rgba(113, 113, 122, ${edge.strength * 0.5 + 0.2})`;
        ctx.lineWidth = edge.strength * 2 + 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x + pan.x, s.y + pan.y);
        ctx.lineTo(t.x + pan.x, t.y + pan.y);
        ctx.stroke();
      }

      // Nodes
      for (const node of nodes) {
        const cx = node.x + pan.x;
        const cy = node.y + pan.y;
        const r = node.r * zoom;
        const color = node.color || NODE_COLORS[node.type] || 'hsl(var(--chart-2))';
        const isSelected = selectedNode?.id === node.id;
        const isSearchMatch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (isSelected) {
          ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, 2 * Math.PI);
          ctx.fillStyle = `${color}30`; ctx.fill();
        }
        if (isSearchMatch) {
          ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = 'hsl(var(--warning))'; ctx.lineWidth = 2; ctx.stroke();
        }

        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = `${color}80`; ctx.lineWidth = 1; ctx.stroke();

        // Glow
        const grad = ctx.createRadialGradient(cx, cy, r, cx, cy, r * 2.5);
        grad.addColorStop(0, `${color}20`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, cy, r * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = grad; ctx.fill();

        if (showLabels) {
          ctx.fillStyle = 'hsl(var(--muted-foreground))';
          ctx.font = `${Math.max(10, 11 * zoom)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.name, cx, cy + r + 14);
        }
      }

      animRef.current = requestAnimationFrame(simTick);
    };

    animRef.current = requestAnimationFrame(simTick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [selectedNode, searchQuery, showLabels, zoom, pan]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nodes = simRef.current;
    let found: SimNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = mx - (n.x + pan.x);
      const dy = my - (n.y + pan.y);
      if (dx * dx + dy * dy < (n.r * zoom + 5) * (n.r * zoom + 5)) { found = n; break; }
    }
    setSelectedNode(found);
  }, [pan, zoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nodes = simRef.current;
    for (const n of nodes) {
      const dx = mx - (n.x + pan.x);
      const dy = my - (n.y + pan.y);
      if (dx * dx + dy * dy < (n.r * zoom + 5) * (n.r * zoom + 5)) {
        n.pinned = true;
        dragRef.current = { node: n, ox: mx - n.x - pan.x, oy: my - n.y - pan.y };
        return;
      }
    }
  }, [pan, zoom]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.node) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    drag.node.x = mx - pan.x - drag.ox;
    drag.node.y = my - pan.y - drag.oy;
  }, [pan]);

  const handleCanvasMouseUp = useCallback(() => {
    if (dragRef.current.node) {
      dragRef.current.node.pinned = false;
      dragRef.current = { node: null, ox: 0, oy: 0 };
    }
  }, []);

  if (isLoading) {
    return (<div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto"><Skeleton className="h-12 w-48" /><Skeleton className="h-[600px] rounded-xl" /></div>);
  }

  if (isError) {
    return <ErrorState message="Failed to load graph data" description={error?.message || 'An unexpected error occurred'} onRetry={() => refetch()} />;
  }

  const nodes = simRef.current;
  const edges = edgeRef.current;
  const connectedToSelected = edges.filter(e =>
    e.source === selectedNode?.id || e.target === selectedNode?.id
  ).map(e => {
    const otherId = e.source === selectedNode?.id ? e.target : e.source;
    const otherNode = nodes.find(n => n.id === otherId);
    return { edge: e, node: otherNode };
  });

  return (
    <div className="p-6 md:p-8 space-y-4 max-w-screen-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Network className="h-5 w-5 text-primary-text" /></div>
          <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Knowledge Graph</h1>
          <p className="text-sm text-muted mt-0.5">{nodes.length} concepts, {edges.length} relationships</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search nodes..." className="w-48 h-8 text-xs" />
        </div>
      </motion.div>

      <div className="flex gap-4">
        <div className="relative flex-1 rounded-xl border border-border bg-background overflow-hidden" style={{ height: 600 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={e => { e.preventDefault(); setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001))); }}
          />
          <div className="absolute top-3 right-3 flex gap-1">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted hover:text-secondary"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted hover:text-secondary"><ZoomOut className="h-3.5 w-3.5" /></button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted hover:text-secondary"><Maximize className="h-3.5 w-3.5" /></button>
            <button onClick={() => setShowLabels(s => !s)} className={cn("flex h-7 w-7 items-center justify-center rounded-lg border text-muted hover:text-secondary", showLabels ? 'bg-primary/10 border-primary/30 text-secondary' : 'bg-card border-border')}><Layers className="h-3.5 w-3.5" /></button>
          </div>
          <div className="absolute bottom-3 left-3 text-3xs text-muted"><Move className="h-3 w-3 inline mr-1" />Drag to pan • Scroll to zoom • Click nodes</div>
        </div>

        {selectedNode && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-72 shrink-0 rounded-xl border border-border bg-card p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 600 }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color || NODE_COLORS[selectedNode.type] || 'hsl(var(--chart-2))' }} />
                <h3 className="text-sm font-medium text-foreground">{selectedNode.name}</h3>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" size="sm">{selectedNode.type}</Badge>
                {selectedNode.category && <Badge variant="secondary" size="sm">{selectedNode.category}</Badge>}
              </div>
            </div>
            {selectedNode.summary && <p className="text-xs text-secondary leading-relaxed">{selectedNode.summary}</p>}
            {connectedToSelected.length > 0 && (
              <div>
                <h4 className="text-3xs font-semibold text-muted uppercase tracking-wider mb-2">Connected ({connectedToSelected.length})</h4>
                <div className="space-y-1">
                  {connectedToSelected.filter(({ node }) => node).map(({ edge, node }) => (
                    <button key={edge.id} onClick={() => setSelectedNode(node!)}
                      className="w-full flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5 text-left hover:bg-elevated transition-colors">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node!.color || NODE_COLORS[node!.type] || 'hsl(var(--chart-2))' }} />
                      <span className="text-xs text-secondary flex-1 truncate">{node!.name}</span>
                      <span className="text-3xs text-muted">{edge.relationship}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {nodes.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-elevated"><Network className="h-8 w-8 text-muted" /></div>
          <p className="text-sm text-secondary">No knowledge graph data</p>
          <p className="text-xs text-muted mt-1">Upload documents and generate insights to build your knowledge graph.</p>
        </div>
      )}
    </div>
  );
}
