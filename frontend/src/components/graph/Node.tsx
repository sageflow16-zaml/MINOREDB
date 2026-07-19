import { Handle, Position } from 'reactflow';

const NodeWrapper = ({ label, color }: { label: string; color: string }) => (
  <div className={`p-3 rounded-lg border-2 bg-card ${color} shadow-md`}>
    <Handle type="target" position={Position.Top} />
    <div className="text-sm font-semibold truncate">{label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const SourceNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-chart-3" />;
export const ClaimNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-chart-1" />;
export const ConceptNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-chart-2" />;
export const InterpretationNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-chart-3" />;
export const ConflictNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-destructive" />;
export const RQNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-warning" />;
export const HypothesisNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-chart-4" />;
