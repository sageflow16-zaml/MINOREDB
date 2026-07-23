import { Badge } from './badge';
import { Globe, BookOpen, MessageSquare, FileText, Twitter, Link, Database, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const sourceIcons: Record<string, React.ElementType> = {
  web: Globe,
  book: BookOpen,
  chat: MessageSquare,
  document: FileText,
  twitter: Twitter,
  link: Link,
  database: Database,
  ai: Sparkles,
};

const sourceLabels: Record<string, string> = {
  web: 'Web',
  book: 'Book',
  chat: 'Chat',
  document: 'Doc',
  twitter: 'Twitter',
  link: 'Link',
  database: 'DB',
  ai: 'AI',
};

export interface SourceBadgeProps {
  source: string;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const key = source.toLowerCase();
  const Icon = sourceIcons[key] ?? Link;
  const label = sourceLabels[key] ?? source;
  return (
    <Badge variant="outline" size="sm" className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
