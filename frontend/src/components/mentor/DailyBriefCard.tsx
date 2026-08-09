
import {Sun, Target, Brain, AlertTriangle, BookOpen, CheckCircle} from 'lucide-react';
import { useDailyBrief } from '../../hooks/useAIWorkflow';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function DailyBriefCard({ projectId, className }: { projectId: string; className?: string }) {
  const { data: brief, isLoading } = useDailyBrief(projectId);

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="py-3 px-4"><CardTitle className="text-xs font-medium flex items-center gap-2"><Sun className="h-4 w-4 text-primary-text" />Daily Brief</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="animate-pulse space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted/30" />
            <div className="h-2 w-full rounded bg-muted/20" />
            <div className="h-2 w-2/3 rounded bg-muted/20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!brief) return null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary-text" />
          {new Date(brief.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </CardTitle>
        <Badge variant="outline" size="sm">Briefing</Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-background p-2 text-center">
            <p className="text-xs font-bold text-foreground">{brief.pendingResearch}</p>
            <p className="text-3xs text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-lg bg-background p-2 text-center">
            <p className="text-xs font-bold text-foreground">{brief.economicEvents.length}</p>
            <p className="text-3xs text-muted-foreground">Events</p>
          </div>
          <div className="rounded-lg bg-background p-2 text-center">
            <p className="text-xs font-bold text-foreground">{brief.unreadDocuments}</p>
            <p className="text-3xs text-muted-foreground">Unread</p>
          </div>
        </div>

        {/* Most important concept */}
        <div className="rounded-lg bg-chart-4/5 border border-chart-4/10 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="h-3 w-3 text-chart-4" />
            <span className="text-2xs font-medium text-chart-4">Focus Concept</span>
          </div>
          <p className="text-xs text-foreground">{brief.mostImportantConcept.name}</p>
          <p className="text-3xs text-muted">{brief.mostImportantConcept.reason}</p>
        </div>

        {/* Strengths / Weaknesses */}
        <div className="grid grid-cols-2 gap-2">
          {brief.currentStrengths.length > 0 && (
            <div className="rounded-lg bg-success/5 border border-success/10 p-2">
              <p className="text-3xs font-medium text-success mb-0.5 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Strengths
              </p>
              <p className="text-3xs text-muted-foreground line-clamp-2">{brief.currentStrengths.slice(0, 2).join(', ')}</p>
            </div>
          )}
          {brief.currentWeaknesses.length > 0 && (
            <div className="rounded-lg bg-danger/5 border border-danger/10 p-2">
              <p className="text-3xs font-medium text-danger-text mb-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Weaknesses
              </p>
              <p className="text-3xs text-muted-foreground line-clamp-2">{brief.currentWeaknesses.slice(0, 2).join(', ')}</p>
            </div>
          )}
        </div>

        {/* Recommended task */}
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3 w-3 text-primary-text" />
            <span className="text-2xs font-medium text-primary-text">Next Task</span>
          </div>
          <p className="text-xs text-foreground">{brief.recommendedTask.title}</p>
          <p className="text-3xs text-muted">{brief.recommendedTask.description}</p>
        </div>

        {/* Learning objective */}
        <div className="flex items-center gap-1.5 text-3xs text-muted">
          <BookOpen className="h-3 w-3" />
          <span>{brief.learningObjective}</span>
        </div>
      </CardContent>
    </Card>
  );
}
