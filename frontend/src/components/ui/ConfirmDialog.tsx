import { cn } from '../../lib/utils';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    open,
    isOpen,
    onClose,
    onCancel,
    onConfirm,
    title,
    message,
    description,
    confirmText = 'Confirm',
    confirmLabel,
    cancelText = 'Cancel',
    variant = 'default',
    isLoading,
  } = props;
  const resolvedOpen = open ?? isOpen ?? false;
  const resolvedDesc = description ?? message ?? '';
  const resolvedConfirm = confirmText ?? confirmLabel ?? 'Confirm';
  const handleClose = onClose ?? onCancel ?? (() => {});
  const confirmVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary';

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant !== 'default' && (
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded',
                variant === 'danger' ? 'bg-danger-muted text-danger' : 'bg-warning-muted text-warning'
              )}>
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{resolvedDesc}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
            {resolvedConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
