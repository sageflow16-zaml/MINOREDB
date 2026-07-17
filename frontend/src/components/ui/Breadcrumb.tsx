import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** Derives a human-readable label from a URL segment. */
function labelize(segment: string): string {
  if (!segment) return '';
  return segment
    .replace(/-/g, ' ')
    .replace(/[_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Lightweight breadcrumb derived from the current location. */
export const Breadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm text-slate-500 dark:text-slate-400">Home</span>;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-slate-500 dark:text-slate-400">
      <Link to="/" className="hover:text-slate-900 dark:hover:text-white">
        Home
      </Link>
      {segments.map((seg, i) => {
        const to = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        return (
          <span key={to} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="text-slate-900 dark:text-white font-medium">{labelize(seg)}</span>
            ) : (
              <Link to={to} className="hover:text-slate-900 dark:hover:text-white">
                {labelize(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};