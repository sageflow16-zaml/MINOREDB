import { motion, AnimatePresence } from 'framer-motion';
import {CheckCircle, Circle, Target} from 'lucide-react';
import { useAITasks } from '../../hooks/useAIWorkflow';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { AITask } from '../../lib/ai/types';

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: 'bg-danger',
    medium: 'bg-warning',
    low: 'bg-muted-foreground/40',
  };
  return <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', colors[priority] || colors.low)} />;
}

function TaskRow({ task, onComplete }: { task: AITask; onComplete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="flex items-start gap-2.5 group"
    >
      <button
        onClick={() => onComplete(task.id)}
        className="mt-0.5 shrink-0 text-muted-foreground/40 hover:text-success transition-colors"
      >
        <Circle className="h-4 w-4 group-hover:hidden" />
        <CheckCircle className="h-4 w-4 hidden group-hover:block" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground truncate">{task.title}</span>
          <PriorityDot priority={task.priority} />
        </div>
        <p className="text-3xs text-muted line-clamp-1">{task.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-3xs text-muted-foreground">{task.estimatedMinutes} min</span>
          {task.category && (
            <Badge variant="outline" size="sm">{task.category}</Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AITaskList({ projectId, className }: { projectId?: string; className?: string }) {
  const { tasks, completeTask } = useAITasks(projectId);
  if (!tasks.length) {
    return (
      <div className={cn('flex flex-col items-center py-6 text-center', className)}>
        <Target className="h-5 w-5 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No pending tasks</p>
        <p className="text-3xs text-muted mt-1">Tasks will appear as you use the platform</p>
      </div>
    );
  }
  const high = tasks.filter((t) => t.priority === 'high');
  const medium = tasks.filter((t) => t.priority === 'medium');
  const low = tasks.filter((t) => t.priority === 'low');
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Target className="h-3.5 w-3.5 text-primary-text" />
        <span className="text-2xs font-medium text-foreground">AI Tasks</span>
        <span className="text-3xs text-muted-foreground">({tasks.length})</span>
      </div>
      <AnimatePresence>
        {high.length > 0 && (
          <div>
            <p className="text-3xs font-medium text-danger-text mb-0.5">Priority</p>
            {high.map((t) => (<TaskRow key={t.id} task={t} onComplete={completeTask} />))}
          </div>
        )}
        {medium.map((t) => (<TaskRow key={t.id} task={t} onComplete={completeTask} />))}
        {low.map((t) => (<TaskRow key={t.id} task={t} onComplete={completeTask} />))}
      </AnimatePresence>
    </div>
  );
}
