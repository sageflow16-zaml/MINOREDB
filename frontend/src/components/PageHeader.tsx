import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode; // backward compat
  onBack?: string | (() => void);
  className?: string;
}

export function PageHeader({ title, description, actions, children, onBack, className }: PageHeaderProps) {
  const resolvedActions = actions ?? children;
  const navigate = useNavigate();

  const handleBack = () => {
    if (!onBack) return;
    if (typeof onBack === 'string') {
      navigate(onBack);
    } else {
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center justify-between gap-4', className)}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {resolvedActions && <div className="flex items-center gap-2">{resolvedActions}</div>}
    </motion.div>
  );
}
