import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { useReducedMotion, reducedMotion as reducedMotionAnim } from '../../lib/animate';

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onBack?: string | (() => void);
  className?: string;
  children?: React.ReactNode; // backward compat — alias for actions
}

function PageHeader({ title, description, actions, onBack, className, children }: PageHeaderProps) {
  const resolvedActions = actions ?? children;
  const navigate = useNavigate();
  const handleBack = () => {
    if (!onBack) return;
    typeof onBack === 'string' ? navigate(onBack) : onBack();
  };

  return (
    <motion.div
      variants={fadeSlideUp}
      className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)}
    >
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2 shrink-0" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      {resolvedActions && <div className="flex items-center gap-2 shrink-0">{resolvedActions}</div>}
    </motion.div>
  );
}

interface PageSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

function PageSection({ title, description, children, className, headerActions }: PageSectionProps) {
  return (
    <motion.section variants={fadeSlideUp} className={cn('space-y-3', className)}>
      {title && (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}

interface PageGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 6;
}

function PageGrid({ children, className, cols = 2 }: PageGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-3', gridCols[cols], className)}>
      {children}
    </div>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidths = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function PageLayout({ children, className, maxWidth = 'xl' }: PageLayoutProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={prefersReduced ? undefined : pageVariants}
      initial={prefersReduced ? reducedMotionAnim.initial : 'initial'}
      animate={prefersReduced ? reducedMotionAnim.animate : 'animate'}
      className={cn('p-6 md:p-8 space-y-6', maxWidths[maxWidth], 'mx-auto', className)}
    >
      {children}
    </motion.div>
  );
}

export { PageHeader, PageSection, PageGrid };
