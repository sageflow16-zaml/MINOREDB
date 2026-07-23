import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../lib/animate';

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

const spring = { type: 'spring' as const, damping: 25, stiffness: 200 };

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: keyof typeof widthMap;
  className?: string;
}

export function RightPanel({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  width = 'xl',
  className,
}: RightPanelProps) {
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { x: '100%' }}
            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { x: '100%' }}
            transition={prefersReduced ? { duration: 0.15 } : spring}
            role="dialog"
            aria-modal="true"
            className={cn(
              'fixed right-0 top-0 z-50 h-full w-full border-l border-border bg-background shadow-xl',
              widthMap[width],
              className,
            )}
          >
            <div className="flex h-full flex-col">
              {title && (
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2">
                    {icon && <span className="text-muted-foreground">{icon}</span>}
                    <h2 className="text-sm font-semibold">{title}</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
              {footer && (
                <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
