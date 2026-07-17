import { useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { useGraphData } from '../hooks/useGraph';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { DetailsDrawer } from '../components/graph/DetailsDrawer';
import { SourceNode, ClaimNode, ConceptNode, InterpretationNode, ConflictNode, RQNode, HypothesisNode } from '../components/graph/Node';

const nodeTypes = {
  source: SourceNode, claim: ClaimNode, concept: ConceptNode,
  interpretation: InterpretationNode, conflict: ConflictNode, 
  research_question: RQNode, hypothesis: HypothesisNode
};

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB' });
  nodes.forEach(node => dagreGraph.setNode(node.id, { width: 150, height: 50 }));
  edges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = { x: nodeWithPosition.x - 75, y: nodeWithPosition.y - 25 };
  });
  return { nodes, edges };
};

export default function GraphExplorerPage() {
  const { projectId, claim_id } = useParams<{ projectId: string, claim_id: string }>();
  const { data, isLoading, error } = useGraphData(projectId!, claim_id!);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useMemo(() => {
    if (!data) return;
    const initialNodes: Node[] = [
      { id: data.claim.id, type: 'claim', data: { label: 'Claim', type: 'Claim', ...data.claim }, position: { x: 0, y: 0 } },
      ...data.concepts.map(c => ({ id: c.id, type: 'concept', data: { label: c.conceptual_term, type: 'Concept', ...c }, position: { x: 0, y: 0 } })),
      ...(data.interpretation ? [{ id: data.interpretation.id, type: 'interpretation', data: { label: 'Interpretation', type: 'Interpretation', ...data.interpretation }, position: { x: 0, y: 0 } }] : []),
      ...data.conflicts.map(c => ({ id: c.id, type: 'conflict', data: { label: 'Conflict', type: 'Conflict', ...c }, position: { x: 0, y: 0 } })),
      ...data.research_questions.map(rq => ({ id: rq.id, type: 'research_question', data: { label: 'RQ', type: 'ResearchQuestion', ...rq }, position: { x: 0, y: 0 } })),
      ...data.hypotheses.map(h => ({ id: h.id, type: 'hypothesis', data: { label: 'Hypothesis', type: 'Hypothesis', ...h }, position: { x: 0, y: 0 } })),
    ];
    
    const initialEdges: Edge[] = [
      ...data.concepts.map(c => ({ id: `e-claim-${c.id}`, source: data.claim.id, target: c.id, animated: true })),
      ...(data.interpretation ? [{ id: `e-interp-${data.interpretation.id}`, source: data.claim.id, target: data.interpretation.id, animated: true }] : []),
      ...data.conflicts.map(c => ({ id: `e-conflict-${c.id}`, source: data.claim.id, target: c.id, animated: true })),
      ...data.research_questions.map(rq => ({ id: `e-rq-${rq.id}`, source: rq.conflict_id, target: rq.id, animated: true })),
      ...data.hypotheses.map(h => ({ id: `e-hyp-${h.id}`, source: h.research_question_id, target: h.id, animated: true })),
    ];
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [data]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState message="Error loading graph." />;

  return (
    <div className="h-screen w-full relative">
      <ReactFlow 
        nodes={nodes} edges={edges} 
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node)}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {selectedNode && <DetailsDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
