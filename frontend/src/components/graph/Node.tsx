import { Handle, Position } from 'reactflow';

const NodeWrapper = ({ label, color }: { label: string; color: string }) => (
  <div className={`p-3 rounded-lg border-2 bg-white dark:bg-slate-800 ${color} shadow-md`}>
    <Handle type="target" position={Position.Top} />
    <div className="text-sm font-semibold truncate">{label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const SourceNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-slate-500" />;
export const ClaimNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-blue-500" />;
export const ConceptNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-emerald-500" />;
export const InterpretationNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-purple-500" />;
export const ConflictNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-red-500" />;
export const RQNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-amber-500" />;
export const HypothesisNode = ({ data }: any) => <NodeWrapper label={data.label} color="border-rose-500" />;
