import { Construction } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface ComingSoonProps {
  title?: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {title ?? 'Coming Soon'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This module is ready for integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
