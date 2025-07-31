import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  closeButton?: boolean;
}

export const DaisyModal = ({
  open,
  onClose,
  children,
  className,
  closeButton = true,
}: ModalProps) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [open]);

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className={cn('modal-box', className)}>
        {closeButton && (
          <form method="dialog" className="absolute right-2 top-2">
            <button className="btn btn-sm btn-circle btn-ghost">
              <X className="h-4 w-4" />
            </button>
          </form>
        )}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export const DaisyModalAction = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('modal-action', className)} {...props}>
      {children}
    </div>
  );
};
