import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300 ease-in-out',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'bg-[#FAFAFA] border border-[#D8C3A5]/30 p-8',
        'shadow-2xl shadow-black/20 rounded-2xl',
        'duration-300 ease-in-out',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-96 data-[state=open]:zoom-in-100',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl',
        'max-h-[90vh] overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute right-6 top-6 rounded-lg p-2',
          'text-[#A8A8A8] hover:text-[#191919]',
          'bg-transparent hover:bg-[#F5F1E9]',
          'border border-transparent hover:border-[#D8C3A5]/30',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-[#D8C3A5]/30 focus:ring-offset-2 focus:ring-offset-[#FAFAFA]',
          'disabled:pointer-events-none disabled:opacity-50',
          'group'
        )}
      >
        <X className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-3 text-left mb-6 pb-4 border-b border-[#D8C3A5]/20',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0',
      'pt-6 mt-6 border-t border-[#D8C3A5]/20',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-tight tracking-tight text-[#191919] font-inter',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm leading-relaxed text-[#A8A8A8] font-inter', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogLarge = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%]',
        'max-h-[90vh] overflow-y-auto',
        'bg-[#FAFAFA] border border-[#D8C3A5]/30',
        'p-8',
        'shadow-2xl shadow-black/20',
        'rounded-2xl',
        'duration-300 ease-in-out',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      <DialogPrimitive.Close
        className={cn(
          'absolute right-6 top-6 rounded-lg p-2',
          'text-[#A8A8A8] hover:text-[#191919]',
          'bg-transparent hover:bg-[#F5F1E9]',
          'border border-transparent hover:border-[#D8C3A5]/30',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-[#D8C3A5]/30 focus:ring-offset-2 focus:ring-offset-[#FAFAFA]',
          'disabled:pointer-events-none disabled:opacity-50',
          'group z-10'
        )}
      >
        <X className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogLarge.displayName = 'DialogLarge';

const DialogFullscreen = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        'bg-[#FAFAFA]',
        'p-8',
        'duration-300 ease-in-out',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100',
        className
      )}
      {...props}
    >
      <DialogPrimitive.Close
        className={cn(
          'absolute right-6 top-6 rounded-lg p-3',
          'text-[#A8A8A8] hover:text-[#191919]',
          'bg-white hover:bg-[#F5F1E9]',
          'border border-[#D8C3A5]/30 hover:border-[#D8C3A5]',
          'shadow-md hover:shadow-lg',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-[#D8C3A5]/30 focus:ring-offset-2 focus:ring-offset-[#FAFAFA]',
          'disabled:pointer-events-none disabled:opacity-50',
          'group z-10'
        )}
      >
        <X className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogFullscreen.displayName = 'DialogFullscreen';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogLarge,
  DialogFullscreen,
};
