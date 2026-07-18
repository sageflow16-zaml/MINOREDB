import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useKnowledgeGraphData, useKnowledgeGraphSnapshot } from '../hooks/useKnowledgeGraph';
import { knowledgeGraphService } from '../api/knowledgeGraph';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import type { KnowledgeNode, KnowledgeEdge, GraphSnapshot } from '../api/types';

const NODE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'session', label: 'Session' },
  { value: 'weekly_bias', label: 'Weekly Bias' },
  { value: 'daily_bias', label: 'Daily Bias' },
  { value: 'h4_bias', label: 'H4 Bias' },
  { value: 'market_phase', label: 'Market Phase' },
  { value: 'market_trend', label: 'Market Trend' },
  { value: 'entry_model', label: 'Entry Model' },
  { value: 'liquidity_type', label: 'Liquidity' },
  { value: 'execution_model', label: 'Execution' },
  { value: 'result', label: 'Outcome' },
  { value: 'pair', label: 'Pair' },
  { value: 'direction', label: 'Direction' },
  { value: 'confidence_level', label: 'Confidence' },
];

const TYPE_COLORS: Record<string, string> = {
  session: '#6366f1',
  weekly_bias: '#8b5cf6',
  daily_bias: '#a78bfa',
  h4_bias: '#c4b5fd',
  market_phase: '#f59e0b',
  market_trend: '#f97316',
  entry_model: '#10b981',
  liquidity_type: '#06b6d4',
  execution_model: '#3b82f6',
  result: '#ef4444',
  pair: '#ec4899',
  direction: '#14b8a6',
  confidence_level: '#84cc16',
};

interface SimNode extends KnowledgeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pinned: boolean;
}

interface SimEdge extends KnowledgeEdge {
  source: string;
  target: string;
}

function forceSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  width: number,
  height: number,
) {
  const REPULSION = 3000;
  const ATTRACTION = 0.005;
  const DAMPING = 0.9;
  const CENTER = 0.01;

  for (const n of nodes) {
    if (n.pinned) continue;
    let fx = 0, fy = 0;

    for (const other of nodes) {
      if (n.id === other.id) continue;
      const dx = n.x - other.x;
      const dy = n.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      fx += (dx / dist) * REPULSION / (dist * dist);
      fy += (dy / dist) * REPULSION / (dist * dist);
    }

    for (const e of edges) {
      let otherId = '';
      if (e.source === n.id) otherId = e.target;
      else if (e.target === n.id) otherId = e.source;
      if (!otherId) continue;
      const other = nodes.find((no) => no.id === otherId);
      if (!other) continue;
      const dx = other.x - n.x;
      const dy = other.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const strength = (e.confidence || 0.5) * ATTRACTION;
      fx += dx * strength;
      fy += dy * strength;
    }

    fx -= (n.x - width / 2) * CENTER;
    fy -= (n.y - height / 2) * CENTER;

    n.vx = (n.vx + fx) * DAMPING;
    n.vy = (n.vy + fy) * DAMPING;
    n.x += n.vx;
    n.y += n.vy;
    n.x = Math.max(n.radius, Math.min(width - n.radius, n.x));
    n.y = Math.max(n.radius, Math.min(height - n.radius, n.y));
  }
}

export default function KnowledgeGraphPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [filterType, setFilterType] = useState('');
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [connectedEdgeIds, setConnectedEdgeIds] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const simRef = useRef<SimNode[]>([]);
  const edgeRef = useRef<SimEdge[]>([]);
  const animRef = useRef<number>(0);
  const dragRef = useRef<{ node: SimNode | null; ox: number; oy: number }>({ node: null, ox: 0, oy: 0 });

  const { data, isLoading, error } = useKnowledgeGraphData(projectId!, filterType || undefined);
  const { data: snapshot } = useKnowledgeGraphSnapshot(projectId!);

  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      setDim({ w: parent.clientWidth, h: Math.max(400, parent.clientHeight || 600) });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const nodes: SimNode[] = data.nodes.map((n) => ({
      ...n,
      x: Math.random() * dim.w,
      y: Math.random() * dim.h,
      vx: 0,
      vy: 0,
      radius: Math.max(20, Math.min(40, 20 + n.occurrences * 2)),
      pinned: false,
    }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edges: SimEdge[] = data.edges
      .filter((e) => nodeMap.has(e.source_node_id) && nodeMap.has(e.target_node_id))
      .map((e) => ({
        ...e,
        source: e.source_node_id,
        target: e.target_node_id,
      }));

    simRef.current = nodes;
    edgeRef.current = edges;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const step = () => {
      if (!running) return;
      forceSimulation(nodes, edges, dim.w, dim.h);
      ctx.clearRect(0, 0, dim.w, dim.h);

      for (const e of edges) {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = connectedEdgeIds.has(e.id) ? '#818cf8' : '#374151';
        ctx.lineWidth = connectedEdgeIds.has(e.id) ? 2 : Math.max(0.5, (e.confidence || 0.5) * 3);
        ctx.globalAlpha = connectedEdgeIds.has(e.id) ? 0.9 : 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = TYPE_COLORS[n.type] || '#6b7280';
        ctx.fill();
        ctx.strokeStyle = selectedNode?.id === n.id ? '#fff' : '#1f2937';
        ctx.lineWidth = selectedNode?.id === n.id ? 3 : 1;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(10, n.radius * 0.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = n.name.length > 8 ? n.name.substring(0, 7) + '..' : n.name;
        ctx.fillText(label, n.x, n.y);
      }

      animRef.current = requestAnimationFrame(step);
    };
    step();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [data, dim, selectedNode, connectedEdgeIds]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const clicked = simRef.current.find((n) => {
        const dx = mx - n.x;
        const dy = my - n.y;
        return dx * dx + dy * dy <= n.radius * n.radius;
      });

      if (clicked) {
        setSelectedNode(clicked);
        const connected = new Set<string>();
        for (const edge of edgeRef.current) {
          if (edge.source === clicked.id || edge.target === clicked.id) {
            connected.add(edge.id);
          }
        }
        setConnectedEdgeIds(connected);
      } else {
        setSelectedNode(null);
        setConnectedEdgeIds(new Set());
      }
    },
    [],
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const clicked = simRef.current.find((n) => {
        const dx = mx - n.x;
        const dy = my - n.y;
        return dx * dx + dy * dy <= n.radius * n.radius;
      });
      if (clicked) {
        clicked.pinned = true;
        dragRef.current = { node: clicked, ox: mx - clicked.x, oy: my - clicked.y };
      }
    },
    [],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag.node) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      drag.node.x = e.clientX - rect.left - drag.ox;
      drag.node.y = e.clientY - rect.top - drag.oy;
    },
    [],
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (dragRef.current.node) {
      dragRef.current.node.pinned = false;
      dragRef.current = { node: null, ox: 0, oy: 0 };
    }
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading knowledge graph." />;
  if (!data || data.nodes.length === 0) return <EmptyState message="No graph data yet. Create trades to build the knowledge graph." />;

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader
        title="Knowledge Graph"
        description="Interactive force-directed graph of trading knowledge derived from trade memories."
      >
        {snapshot && (
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>{snapshot.total_nodes} nodes</span>
            <span>{snapshot.total_edges} edges</span>
            {snapshot.most_connected_type && (
              <span>Most connected: {snapshot.most_connected_type}</span>
            )}
          </div>
        )}
      </PageHeader>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by type:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {NODE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSelectedNode(null);
            setConnectedEdgeIds(new Set());
          }}
          className="ml-auto rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Clear Selection
        </button>
      </div>

      <div className="relative flex flex-1 gap-4">
        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-900 dark:border-slate-700">
          <canvas
            ref={canvasRef}
            width={dim.w}
            height={dim.h}
            className="h-full w-full cursor-grab active:cursor-grabbing"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        {selectedNode && (
          <div className="w-72 shrink-0 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedNode.name}</h3>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: TYPE_COLORS[selectedNode.type] || '#6b7280' }}
            >
              {selectedNode.type}
            </span>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedNode.category || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Occurrences</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedNode.occurrences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Weight</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedNode.weight != null ? selectedNode.weight.toFixed(2) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Connected Edges</span>
                <span className="font-medium text-slate-900 dark:text-white">{connectedEdgeIds.size}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Connected Edges</h4>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {edgeRef.current
                  .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                  .slice(0, 10)
                  .map((e) => {
                    const otherId = e.source === selectedNode.id ? e.target : e.source;
                    const other = simRef.current.find((n) => n.id === otherId);
                    return (
                      <div key={e.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800">
                        <span className="text-slate-700 dark:text-slate-300">{other?.name || '?'}</span>
                        <span className="text-slate-500">c:{e.confidence != null ? e.confidence.toFixed(2) : '—'}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
