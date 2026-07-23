import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

function labelize(segment: string): string {
  if (!segment) return '';
  return segment
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm text-muted-foreground">Home</span>;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((seg, i) => {
        const to = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        return (
          <span key={to} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium" aria-current="page">{labelize(seg)}</span>
            ) : (
              <Link to={to} className="hover:text-foreground transition-colors">
                {labelize(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};
