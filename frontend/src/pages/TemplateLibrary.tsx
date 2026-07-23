import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '../hooks/useObsidian';
import { FileText, Plus, Trash2, Copy, BookOpen } from 'lucide-react';
import type { NoteTemplate } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const templateTypes = [
  { value: 'trade_review', label: 'Trade Review' },
  { value: 'daily_journal', label: 'Daily Journal' },
  { value: 'weekly_review', label: 'Weekly Review' },
  { value: 'monthly_review', label: 'Monthly Review' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'research', label: 'Research' },
  { value: 'psychology', label: 'Psychology Session' },
  { value: 'market_prep', label: 'Market Preparation' },
  { value: 'post_market', label: 'Post-Market Review' },
];

const defaultTemplates: Record<string, string> = {
  trade_review: `# Trade Review — {{pair}} {{date}}

## Setup
- **Pair:** {{pair}}
- **Direction:** {{direction}}
- **Strategy:** {{strategy}}
- **Entry:** {{entry}}
- **Stop Loss:** {{sl}}
- **Take Profit:** {{tp}}

## Result
- **P&L:** {{pnl}}
- **R:R:** {{rr}}
- **Result:** {{result}}

## Analysis
### What went well


### What went wrong


### Emotions


### Lessons Learned


## Screenshots
![[before.png]]
![[after.png]]

---
Tags: #trade-review #{{pair}} #{{strategy}}
`,
  daily_journal: `# Daily Journal — {{date}}

## Market Overview
- **Session:** {{session}}
- **Bias:**
- **Key Levels:**

## Trades Taken


## Observations


## End of Day Review
- **Discipline Score:** /10
- **Adherence to Plan:** /10
- **One Thing to Improve:**

---
Tags: #journal #daily
`,
  weekly_review: `# Weekly Review — {{week}}

## Summary
- **Total Trades:**
- **Win Rate:**
- **Total P&L:**
- **Best Trade:**
- **Worst Trade:**

## What Worked

## What Didn't Work

## Key Lessons

## Goals for Next Week

---
Tags: #review #weekly
`,
  strategy: `# Strategy — {{name}}

## Overview
- **Type:**
- **Timeframe:**
- **Markets:**
- **Sessions:**

## Entry Rules


## Exit Rules


## Risk Management


## Conditions to Avoid


## Performance Stats

---
Tags: #strategy
`,
  research: `# Research — {{topic}}

## Question


## Findings


## Sources


## Conclusions


## Action Items

---
Tags: #research
`,
  psychology: `# Psychology Session — {{date}}

## Current State
- **Mood:**
- **Confidence Level:**
- **Stress Level:**

## Recent Patterns


## Emotional Triggers


## Coping Strategies


## Goals

---
Tags: #psychology
`,
  market_prep: `# Market Prep — {{date}}

## Key Levels
- **Support:**
- **Resistance:**

## Bias
- **Weekly:**
- **Daily:**
- **H4:**

## Watchlist


## Events to Watch


## Risk Allocation

---
Tags: #prep #market
`,
  post_market: `# Post-Market — {{date}}

## What Happened


## What I Expected


## Deviations


## Lessons


## Notes for Tomorrow

---
Tags: #post-market
`,
};

export default function TemplateLibraryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', template_type: 'trade_review', content: '', target_folder: '' });

  const templates = useTemplates(projectId!, filterType || undefined);
  const createTemplate = useCreateTemplate(projectId!);
  const deleteTemplate = useDeleteTemplate(projectId!);

  const templatesData = templates.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Template Library"
          description="Reusable Obsidian note templates for trading workflows"
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                // Seed all default templates
                Object.entries(defaultTemplates).forEach(([type, content]) => {
                  createTemplate.mutate({ name: templateTypes.find(t => t.value === type)?.label || type, template_type: type, content });
                });
              }}>Seed Defaults</Button>
              <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                <Plus className="h-4 w-4 mr-1" />New Template
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filterType === '' ? 'default' : 'outline'} onClick={() => setFilterType('')}>All</Button>
        {templateTypes.map((t) => (
          <Button key={t.value} size="sm" variant={filterType === t.value ? 'default' : 'outline'} onClick={() => setFilterType(t.value)}>{t.label}</Button>
        ))}
      </motion.div>

      {showCreate && (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template Name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <select value={form.template_type} onChange={(e) => setForm({ ...form, template_type: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {templateTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input value={form.target_folder} onChange={(e) => setForm({ ...form, target_folder: e.target.value })} placeholder="Target Folder" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Template content with {{placeholders}}..." rows={8} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { createTemplate.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ name: '', template_type: 'trade_review', content: '', target_folder: '' }); }}); }} disabled={!form.name || !form.content}>Create</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {templates.isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : templatesData.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
          {templatesData.map((t: NoteTemplate) => (
            <motion.div key={t.id} variants={item}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{t.name}</h4>
                        <Badge variant="outline" className="text-[10px]">{t.template_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.content.substring(0, 150)}...</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Used {t.use_count} times</span>
                        {t.target_folder && <span>→ {t.target_folder}</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteTemplate.mutate(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState message="No templates yet. Click 'Seed Defaults' or create a new template." />
      )}
    </motion.div>
  );
}
