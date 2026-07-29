import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { KnowledgeEntity, EntityConnection, ENTITY_COLORS, ENTITY_LABELS, RELATIONSHIP_LABELS } from './types';

interface GraphViewProps {
  entities: KnowledgeEntity[];
  connections: EntityConnection[];
  selectedId?: string | null;
  onSelect: (entity: KnowledgeEntity | null) => void;
  loading: boolean;
}

function entityToNode(entity: KnowledgeEntity, isSelected: boolean): Node {
  const color = ENTITY_COLORS[entity.type];
  return {
    id: entity.id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: {
      label: entity.title,
      subtitle: ENTITY_LABELS[entity.type],
      color,
      confidence: entity.confidence,
    },
    style: {
      background: `color-mix(in srgb, ${color} 8%, hsl(var(--surface)))`,
      border: `1.5px solid ${isSelected ? color : `${color}40`}`,
      borderRadius: '10px',
      padding: '8px 12px',
      width: 180,
      boxShadow: isSelected ? `0 0 0 2px ${color}40` : '0 1px 3px rgba(0,0,0,0.08)',
    },
    selected: isSelected,
  };
}

function connectionToEdge(conn: EntityConnection): Edge {
  return {
    id: `${conn.source.id}-${conn.target.id}-${conn.relationship}`,
    source: conn.source.id,
    target: conn.target.id,
    label: RELATIONSHIP_LABELS[conn.relationship],
    type: 'smoothstep',
    animated: conn.confidence > 70,
    style: {
      stroke: conn.confidence > 70 ? 'hsl(var(--chart-4))' : 'hsl(var(--border))',
      strokeWidth: Math.max(1, Math.min(4, conn.strength * 2)),
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--border))' },
    labelStyle: { fontSize: 9, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' },
    labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.9 },
  };
}

export function KnowledgeGraphView({ entities, connections, selectedId, onSelect, loading }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    if (!entities.length) return { nodes: [], edges: [] };
    const nodeMap = new Map(entities.map((e) => [e.id, e]));
    const validConnections = connections.filter((c) => nodeMap.has(c.source.id) && nodeMap.has(c.target.id));
    const ns = entities.map((e) => entityToNode(e, e.id === selectedId));
    const es = validConnections.map(connectionToEdge);
    return applySimpleLayout(ns, es);
  }, [entities, connections, selectedId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (!entities.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center max-w-xs">
          <p className="text-sm text-muted-foreground">No knowledge connections yet</p>
          <p className="text-xs text-muted">Upload documents and trade to build your knowledge network</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      onNodeClick={(_, node) => {
        const entity = entities.find((e) => e.id === node.id);
        if (entity) onSelect(entity.id === selectedId ? null : entity);
      }}
      onPaneClick={() => onSelect(null)}
      minZoom={0.1}
      maxZoom={2}
    >
      <Background color="hsl(var(--border))" gap={20} size={1} />
      <Controls showInteractive={false} className="[&_button]:!bg-surface [&_button]:!border-border [&_button]:!text-muted-foreground" />
      <MiniMap
        nodeColor={(n) => n.data?.color || 'hsl(var(--muted))'}
        maskColor="hsl(var(--background))"
        style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
      />
    </ReactFlow>
  );
}

function applySimpleLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  if (!nodes.length) return { nodes, edges };
  const radius = Math.max(200, nodes.length * 30);
  const angleStep = (2 * Math.PI) / nodes.length;
  const laidOut = nodes.map((node, i) => ({
    ...node,
    position: {
      x: radius * Math.cos(angleStep * i - Math.PI / 2) + 300,
      y: radius * Math.sin(angleStep * i - Math.PI / 2) + 300,
    },
  }));
  return { nodes: laidOut, edges };
}
