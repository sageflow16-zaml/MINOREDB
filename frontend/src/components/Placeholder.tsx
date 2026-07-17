import { Construction } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';

/**
 * Foundation-level placeholder shown for project modules that have not been
 * implemented yet. Keeps the application shell navigable end-to-end.
 */
export default function Placeholder() {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
            <Construction className="h-8 w-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Module not implemented yet
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This section of Project Minore is part of the next implementation phase.
            The application shell, routing, and authentication foundation are in place.
          </p>
          {projectId && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Active project: <span className="font-mono">{projectId}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}