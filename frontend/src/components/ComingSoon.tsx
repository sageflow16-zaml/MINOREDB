import { Construction } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface ComingSoonProps {
  title?: string;
}

/**
 * Professional placeholder card shown for modules that are scaffolded but not
 * yet integrated with the backend. Keeps the authenticated shell navigable.
 */
export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
            <Construction className="h-8 w-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {title ?? 'Coming Soon'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This module is ready for integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}