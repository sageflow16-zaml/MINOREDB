import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useTemplates, useCreateFromTemplate, useTemplateCategories } from '../hooks/useAutomation';
import {
  GitBranch, Sunrise, ClipboardCheck, Sunset, Calendar, BarChart3,
  Shield, TrendingDown, Frown, Microscope, Heart, Plus,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const categoryIcons: Record<string, typeof GitBranch> = {
  trading: Sunrise, reporting: BarChart3, risk: Shield, psychology: Heart, research: Microscope,
};

const categoryColors: Record<string, string> = {
  trading: 'text-primary', reporting: 'text-success', risk: 'text-warning', psychology: 'text-destructive', research: 'text-info',
};

export default function AutomationTemplates() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: templates = [], isLoading } = useTemplates(projectId!, category);
  const { data: categories = [] } = useTemplateCategories(projectId!);
  const createFromTmpl = useCreateFromTemplate(projectId!);

  const handleUseTemplate = (templateId: string, name: string) => {
    createFromTmpl.mutate({ templateId, name: `${name} (from template)` }, {
      onSuccess: (data) => navigate(`/projects/${projectId}/automation/workflows/${data.id}`),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Workflow Templates"
        description="Pre-built automation templates for common trading workflows"
      />

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={!category ? 'default' : 'outline'} onClick={() => setCategory(undefined)}>All</Button>
        {categories.map((c: string) => {
          const Icon = categoryIcons[c] || GitBranch;
          return (
            <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)}>
              <Icon className="w-3.5 h-3.5 mr-1" />{c}
            </Button>
          );
        })}
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const Icon = categoryIcons[t.category || ''] || GitBranch;
            const color = categoryColors[t.category || ''] || 'text-muted-foreground';
            return (
              <Card key={t.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`w-4 h-4 ${color}`} />
                    {t.name}
                    {t.is_built_in && <Badge variant="info" className="text-[10px] px-1.5">Built-in</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                  {t.triggers_config && t.triggers_config.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Triggers:</div>
                      <div className="flex gap-1 flex-wrap">
                        {(t.triggers_config as Record<string, unknown>[]).map((tr, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{tr.trigger_type as string}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {t.actions_config && t.actions_config.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Actions:</div>
                      <div className="flex gap-1 flex-wrap">
                        {(t.actions_config as Record<string, unknown>[]).map((a, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{a.action_type as string}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button size="sm" className="w-full" onClick={() => handleUseTemplate(t.id, t.name)}
                    disabled={createFromTmpl.isPending}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Use Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No templates" message="No templates available for the selected category" />
      )}
    </motion.div>
  );
}
