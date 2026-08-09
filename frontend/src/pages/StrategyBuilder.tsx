import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';

import { Select } from '../components/ui/select';
import {LoadingSpinner} from '../components/ui/Feedback';

import { useStrategy, useCreateStrategy, useUpdateStrategy } from '../hooks/useStrategies';
import type { StrategyCreate, StrategyUpdate, ChecklistItem } from '../api/types';
import {ArrowLeft, Save, Plus, X, CheckCircle2, BookOpen, Activity, Zap, Clock, Brain} from 'lucide-react';
import { cn } from '../lib/utils';

const defaultStrategy: StrategyCreate = {
  name: '',
  description: '',
  category: '',
  market: '',
  instrument_types: [],
  timeframes: [],
  version: '1.0.0',
  status: 'Draft',
  market_bias: '',
  entry_conditions: {},
  confirmation_rules: [],
  invalidation_rules: [],
  exit_rules: {},
  risk_rules: {},
  entry_model: '',
  stop_loss_model: '',
  take_profit_model: '',
  partial_close_rules: [],
  trade_management_rules: [],
  preferred_sessions: [],
  preferred_market_conditions: '',
  volatility_requirements: '',
  news_restrictions: '',
  required_mindset: '',
  discipline_rules: [],
  common_mistakes: [],
  things_to_avoid: [],
  checklist_items: [],
  documentation: '',
  tags: [],
  author: '',
};

const categoryOptions = ['Trend Following', 'Mean Reversion', 'Breakout', 'Scalping', 'Swing', 'Position', 'ICT', 'Supply & Demand', 'Order Flow', 'Custom'];
const marketOptions = ['Forex', 'Crypto', 'Stocks', 'Indices', 'Commodities', 'Futures', 'Options', 'Bonds'];
const sessionOptions = ['Asian', 'London', 'New York', 'Sydney', 'London/NY Overlap'];

export default function StrategyBuilderPage() {
  const navigate = useNavigate();
  const { projectId, strategyId } = useParams<{ projectId: string; strategyId: string }>();
  const isEdit = !!strategyId;
  const { data: existing, isLoading: loadingExisting } = useStrategy(projectId!, strategyId!);
  const createStrategy = useCreateStrategy(projectId!);
  const updateStrategy = useUpdateStrategy(projectId!);

  const [form, setForm] = useState<StrategyCreate>(defaultStrategy);
  const [saving, setSaving] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newTag, setNewTag] = useState('');
  const [listInputs, setListInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name || '',
        description: existing.description || '',
        category: existing.category || '',
        market: existing.market || '',
        instrument_types: existing.instrument_types || [],
        timeframes: existing.timeframes || [],
        version: existing.version || '1.0.0',
        status: existing.status || 'Draft',
        market_bias: existing.market_bias || '',
        entry_conditions: existing.entry_conditions || {},
        confirmation_rules: existing.confirmation_rules || [],
        invalidation_rules: existing.invalidation_rules || [],
        exit_rules: existing.exit_rules || {},
        risk_rules: existing.risk_rules || {},
        entry_model: existing.entry_model || '',
        stop_loss_model: existing.stop_loss_model || '',
        take_profit_model: existing.take_profit_model || '',
        partial_close_rules: existing.partial_close_rules || [],
        trade_management_rules: existing.trade_management_rules || [],
        preferred_sessions: existing.preferred_sessions || [],
        preferred_market_conditions: existing.preferred_market_conditions || '',
        volatility_requirements: existing.volatility_requirements || '',
        news_restrictions: existing.news_restrictions || '',
        required_mindset: existing.required_mindset || '',
        discipline_rules: existing.discipline_rules || [],
        common_mistakes: existing.common_mistakes || [],
        things_to_avoid: existing.things_to_avoid || [],
        checklist_items: existing.checklist_items || [],
        documentation: existing.documentation || '',
        tags: existing.tags || [],
        author: existing.author || '',
      });
    }
  }, [isEdit, existing]);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const addListItem = (field: string) => {
    const val = listInputs[field]?.trim();
    if (!val) return;
    const current = (form as any)[field] || [];
    updateField(field, [...current, val]);
    setListInputs((prev) => ({ ...prev, [field]: '' }));
  };

  const removeListItem = (field: string, index: number) => {
    const current = (form as any)[field] || [];
    updateField(field, current.filter((_: any, i: number) => i !== index));
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const items: ChecklistItem[] = form.checklist_items || [];
    updateField('checklist_items', [...items, { label: newCheckItem.trim(), category: '', optional: false }]);
    setNewCheckItem('');
  };

  const removeCheckItem = (index: number) => {
    const items = form.checklist_items || [];
    updateField('checklist_items', items.filter((_, i) => i !== index));
  };

  const toggleSession = (session: string) => {
    const current = form.preferred_sessions || [];
    if (current.includes(session)) {
      updateField('preferred_sessions', current.filter((s) => s !== session));
    } else {
      updateField('preferred_sessions', [...current, session]);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const tags = form.tags || [];
    if (!tags.includes(newTag.trim())) {
      updateField('tags', [...tags, newTag.trim()]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    updateField('tags', (form.tags || []).filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateStrategy.mutateAsync({ id: strategyId!, data: form as StrategyUpdate });
      } else {
        await createStrategy.mutateAsync(form);
      }
      navigate(`/projects/${projectId}/strategies`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) return <LoadingSpinner />;

  function ListField({ field, label, placeholder }: { field: string; label: string; placeholder?: string }) {
    const items: string[] = (form as any)[field] || [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <div className="flex gap-2">
          <Input placeholder={placeholder || `Add ${label.toLowerCase()}...`} value={listInputs[field] || ''} onChange={(e) => setListInputs((prev) => ({ ...prev, [field]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addListItem(field); } }} />
          <Button variant="outline" size="sm" onClick={() => addListItem(field)}><Plus className="h-4 w-4" /></Button>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-1 text-xs text-foreground">
                {item}
                <button onClick={() => removeListItem(field, i)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={isEdit ? 'Edit Strategy' : 'Create Strategy'}
        description={isEdit ? 'Update your trading strategy.' : 'Define a new trading strategy.'}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!form.name.trim() || saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save Strategy'}
          </Button>
        </div>
      </PageHeader>

      {/* General */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <Input placeholder="e.g. ICT 2022 Model" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]" placeholder="Describe your strategy..." value={form.description || ''} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select
                value={form.category || ''}
                onChange={(v) => updateField('category', v)}
                placeholder="Select..."
                options={categoryOptions.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Market</label>
              <Select
                value={form.market || ''}
                onChange={(v) => updateField('market', v)}
                placeholder="Select..."
                options={marketOptions.map((m) => ({ value: m, label: m }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={form.status || 'Draft'}
                onChange={(v) => updateField('status', v)}
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Archived', label: 'Archived' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Author</label>
              <Input placeholder="Your name" value={form.author || ''} onChange={(e) => updateField('author', e.target.value)} />
            </div>
          </div>
          <ListField field="instrument_types" label="Instrument Types" placeholder="e.g. EUR/USD" />
          <ListField field="timeframes" label="Timeframes" placeholder="e.g. 1H, 4H" />
        </CardContent>
      </Card>

      {/* Trading Rules */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" /> Trading Rules</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Market Bias</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder="Describe your market bias..." value={form.market_bias || ''} onChange={(e) => updateField('market_bias', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Entry Conditions (key-value pairs)</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder='{"condition": "description"}' value={form.entry_conditions ? JSON.stringify(form.entry_conditions, null, 2) : ''} onChange={(e) => { try { updateField('entry_conditions', JSON.parse(e.target.value)); } catch { updateField('entry_conditions', e.target.value); } }} />
          </div>
          <ListField field="confirmation_rules" label="Confirmation Rules" placeholder="e.g. MSS confirmed" />
          <ListField field="invalidation_rules" label="Invalidation Rules" placeholder="e.g. Price rejects OB" />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Exit Rules (key-value pairs)</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder='{"target": "Previous day high"}' value={form.exit_rules ? JSON.stringify(form.exit_rules, null, 2) : ''} onChange={(e) => { try { updateField('exit_rules', JSON.parse(e.target.value)); } catch { updateField('exit_rules', e.target.value); } }} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Risk Rules (key-value pairs)</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder='{"max_risk": "1% per trade"}' value={form.risk_rules ? JSON.stringify(form.risk_rules, null, 2) : ''} onChange={(e) => { try { updateField('risk_rules', JSON.parse(e.target.value)); } catch { updateField('risk_rules', e.target.value); } }} />
          </div>
        </CardContent>
      </Card>

      {/* Execution Model */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Zap className="h-4 w-4" /> Execution Model</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Entry Model</label>
              <Input placeholder="e.g. Limit order" value={form.entry_model || ''} onChange={(e) => updateField('entry_model', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Stop Loss Model</label>
              <Input placeholder="e.g. Below swing low" value={form.stop_loss_model || ''} onChange={(e) => updateField('stop_loss_model', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Take Profit Model</label>
              <Input placeholder="e.g. 1:2 risk/reward" value={form.take_profit_model || ''} onChange={(e) => updateField('take_profit_model', e.target.value)} />
            </div>
          </div>
          <ListField field="partial_close_rules" label="Partial Close Rules" placeholder="e.g. Close 50% at 1:1" />
          <ListField field="trade_management_rules" label="Trade Management Rules" placeholder="e.g. Trail SL after 1:1" />
        </CardContent>
      </Card>

      {/* Context */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /> Trading Context</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Preferred Sessions</label>
            <div className="flex flex-wrap gap-2">
              {sessionOptions.map((s) => (
                <button key={s} type="button" onClick={() => toggleSession(s)}
                  className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    (form.preferred_sessions || []).includes(s)
                      ? 'border-primary bg-primary/10 text-primary-text'
                      : 'border-input text-muted-foreground hover:text-foreground'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Preferred Market Conditions</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder="Describe conditions..." value={form.preferred_market_conditions || ''} onChange={(e) => updateField('preferred_market_conditions', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Volatility Requirements</label>
            <Input placeholder="e.g. ATR > 50" value={form.volatility_requirements || ''} onChange={(e) => updateField('volatility_requirements', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">News Restrictions</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder="Describe news restrictions..." value={form.news_restrictions || ''} onChange={(e) => updateField('news_restrictions', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Psychology */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Brain className="h-4 w-4" /> Trading Psychology</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Required Mindset</label>
            <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder="Describe the mindset needed..." value={form.required_mindset || ''} onChange={(e) => updateField('required_mindset', e.target.value)} />
          </div>
          <ListField field="discipline_rules" label="Discipline Rules" placeholder="e.g. No revenge trading" />
          <ListField field="common_mistakes" label="Common Mistakes" placeholder="e.g. Overtrading after loss" />
          <ListField field="things_to_avoid" label="Things to Avoid" placeholder="e.g. Trading during news" />
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4" /> Pre-Trade Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Add checklist item..." value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem(); } }} />
            <Button variant="outline" size="sm" onClick={addCheckItem}><Plus className="h-4 w-4" /></Button>
          </div>
          {(form.checklist_items || []).length > 0 && (
            <div className="space-y-1.5">
              {(form.checklist_items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2.5">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input" />
                  <span className="text-xs text-foreground flex-1">{item.label}</span>
                  <button onClick={() => removeCheckItem(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4" /> Documentation</CardTitle></CardHeader>
        <CardContent>
          <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[200px] font-mono" placeholder="Write your strategy documentation here. Supports Markdown..." value={form.documentation || ''} onChange={(e) => updateField('documentation', e.target.value)} />
          <p className="text-3xs text-muted-foreground mt-1">Supports Markdown formatting</p>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Tags</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
            <Button variant="outline" size="sm" onClick={addTag}><Plus className="h-4 w-4" /></Button>
          </div>
          {(form.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(form.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary-text">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-primary-text/60 hover:text-primary-text"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Footer */}
      <div className="flex items-center justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : isEdit ? 'Update Strategy' : 'Create Strategy'}
        </Button>
      </div>
    </div>
  );
}
