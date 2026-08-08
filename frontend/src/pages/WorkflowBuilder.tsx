import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { useWorkflow, useUpdateWorkflow, useExecuteWorkflow, useCreateWorkflow } from '../hooks/useAutomation';
import {
  Plus, Play, Save, Trash2, GripVertical, Workflow,
  Bell, Clock, GitBranch, AlertTriangle, Zap, ArrowRight,
  X, ChevronDown, ChevronUp,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: 'text-primary-text' },
  { type: 'action', label: 'Action', icon: Play, color: 'text-success' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-warning' },
  { type: 'loop', label: 'Loop', icon: Clock, color: 'text-info' },
  { type: 'branch', label: 'Branch', icon: ArrowRight, color: 'text-destructive' },
];

const TRIGGER_TYPES = ['scheduled', 'market_open', 'london_open', 'new_york_open', 'economic_event', 'news_release', 'trade_created', 'trade_closed', 'journal_added', 'replay_finished', 'risk_rule_triggered', 'drawdown_threshold', 'performance_threshold', 'strategy_updated', 'webhook', 'manual'];
const ACTION_TYPES = ['create_journal_entry', 'generate_ai_summary', 'generate_daily_brief', 'generate_weekly_review', 'run_analytics', 'run_backtest', 'export_report', 'create_task', 'update_strategy', 'send_notification', 'open_trade_review', 'generate_research_note', 'sync_obsidian', 'update_dashboard', 'run_ai_coach'];
const CONDITION_TYPES = ['win_rate', 'drawdown', 'risk_pct', 'session', 'market', 'pair', 'strategy', 'performance', 'psychology_score', 'execution_score', 'ai_score', 'custom_variable'];

export default function WorkflowBuilder() {
  const { projectId, workflowId } = useParams<{ projectId: string; workflowId: string }>()!;
  const navigate = useNavigate();
  const isNew = workflowId === 'new';

  const { data: workflow, isLoading } = useWorkflow(projectId!, isNew ? undefined : workflowId);
  const updateWf = useUpdateWorkflow(projectId!);
  const createWf = useCreateWorkflow(projectId!);
  const execWf = useExecuteWorkflow(projectId!);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nodes, setNodes] = useState<Record<string, unknown>[]>([]);
  const [connections, setConnections] = useState<Record<string, unknown>[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setNodes((workflow.nodes || []) as unknown as Record<string, unknown>[]);
      setConnections((workflow.connections || []) as unknown as Record<string, unknown>[]);
    }
  }, [workflow]);

  const addNode = (type: string) => {
    const newNode: Record<string, unknown> = {
      id: `node_${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
      config: {},
      trigger_type: type === 'trigger' ? 'manual' : undefined,
      action_type: type === 'action' ? 'send_notification' : undefined,
      condition_type: type === 'condition' ? 'win_rate' : undefined,
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(nodes.length);
    setShowPalette(false);
  };

  const removeNode = (index: number) => {
    setNodes(nodes.filter((_, i) => i !== index));
    setSelectedNode(null);
  };

  const updateNodeConfig = (index: number, key: string, value: unknown) => {
    const updated = [...nodes];
    if (updated[index]) {
      updated[index] = { ...(updated[index] as Record<string, unknown>), [key]: value };
    }
    setNodes(updated);
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = { name, description, nodes, connections };
    if (isNew) {
      createWf.mutate(payload, { onSuccess: (data) => navigate(`/projects/${projectId}/automation/workflows/${data.id}`, { replace: true }) });
    } else {
      updateWf.mutate({ id: workflowId!, data: payload });
    }
  };

  const handleExecute = () => {
    if (!isNew) execWf.mutate({ id: workflowId! });
  };

  if (isLoading && !isNew) return <LoadingSpinner />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title={isNew ? 'New Workflow' : name || 'Workflow Builder'}
        description="Build your automation workflow with drag-and-drop nodes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/automation/workflows`)}>Back</Button>
            {!isNew && <Button variant="outline" onClick={handleExecute}><Play className="w-4 h-4 mr-2" />Run</Button>}
            <Button onClick={handleSave} disabled={updateWf.isPending}><Save className="w-4 h-4 mr-2" />Save</Button>
          </div>
        }
      />

      <div className="flex gap-3 items-start">
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="py-4 space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" className="text-lg font-medium" />
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setShowPalette(!showPalette)}><Plus className="w-3.5 h-3.5 mr-1" />Add Node</Button>
            {selectedNode !== null && <Button size="sm" variant="outline" onClick={() => removeNode(selectedNode)}><Trash2 className="w-3.5 h-3.5 mr-1" />Remove</Button>}
          </div>

          {showPalette && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Node Types</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {NODE_TYPES.map((nt) => (
                    <button key={nt.type} onClick={() => addNode(nt.type)}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                    >
                      <nt.icon className={`w-5 h-5 ${nt.color}`} />
                      <span className="text-xs font-medium">{nt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {nodes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Workflow className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Click "Add Node" to start building your workflow</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {nodes.map((node, idx) => (
              <Card key={node.id as string} className={`cursor-pointer transition-colors ${selectedNode === idx ? 'border-primary' : ''}`} onClick={() => setSelectedNode(idx)}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <Badge variant="info" className="text-xs">{node.type as string}</Badge>
                      <span className="font-medium text-sm">{node.label as string}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); removeNode(idx); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                  {selectedNode === idx && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      <Input value={node.label as string} onChange={(e) => updateNodeConfig(idx, 'label', e.target.value)} placeholder="Node label" />
                      {node.type === 'trigger' && (
                        <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                          value={node.trigger_type as string} onChange={(e) => updateNodeConfig(idx, 'trigger_type', e.target.value)}
                        >
                          {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                      )}
                      {node.type === 'action' && (
                        <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                          value={node.action_type as string} onChange={(e) => updateNodeConfig(idx, 'action_type', e.target.value)}
                        >
                          {ACTION_TYPES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                        </select>
                      )}
                      {node.type === 'condition' && (
                        <div className="space-y-2">
                          <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                            value={node.condition_type as string} onChange={(e) => updateNodeConfig(idx, 'condition_type', e.target.value)}
                          >
                            {CONDITION_TYPES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <select className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                              value={node.operator as string} onChange={(e) => updateNodeConfig(idx, 'operator', e.target.value)}
                            >
                              <option value="eq">=</option>
                              <option value="neq">!=</option>
                              <option value="gt">&gt;</option>
                              <option value="gte">&gt;=</option>
                              <option value="lt">&lt;</option>
                              <option value="lte">&lt;=</option>
                              <option value="between">Between</option>
                            </select>
                            <Input value={String(node.value ?? '')} onChange={(e) => updateNodeConfig(idx, 'value', e.target.value)} placeholder="Value" className="flex-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
