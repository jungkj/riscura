/**
 * Daisy UI Components
 *
 * This file provides standardized DaisyUI-based components for consistent
 * styling and behavior across the application.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Card Components
export const DaisyCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card bg-base-100 shadow-xl', className)} {...props} />
  )
);
DaisyCard.displayName = 'DaisyCard';

export const DaisyCardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-body', className)} {...props} />
  )
);
DaisyCardBody.displayName = 'DaisyCardBody';

export const DaisyCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('card-title', className)} {...props} />
));
DaisyCardTitle.displayName = 'DaisyCardTitle';

export const DaisyCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-base-content/70', className)} {...props} />
));
DaisyCardDescription.displayName = 'DaisyCardDescription';

export const DaisyCardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('card-actions', className)} {...props} />
));
DaisyCardActions.displayName = 'DaisyCardActions';

export const DaisyCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('card-actions justify-end', className)} {...props} />
));
DaisyCardFooter.displayName = 'DaisyCardFooter';

// Dialog Components
export const DaisyDialog = React.forwardRef<
  HTMLDialogElement,
  React.HTMLAttributes<HTMLDialogElement>
>(({ className, ...props }, ref) => (
  <dialog ref={ref} className={cn('modal', className)} {...props} />
));
DaisyDialog.displayName = 'DaisyDialog';

export const DaisyDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('modal-box', className)} {...props} />
));
DaisyDialogContent.displayName = 'DaisyDialogContent';

export const DaisyDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => <div ref={ref} className={cn('mb-4', className)} {...props} />);
DaisyDialogHeader.displayName = 'DaisyDialogHeader';

export const DaisyDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-bold text-lg', className)} {...props} />
));
DaisyDialogTitle.displayName = 'DaisyDialogTitle';

export const DaisyDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-base-content/70', className)} {...props} />
));
DaisyDialogDescription.displayName = 'DaisyDialogDescription';

export const DaisyDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('modal-action', className)} {...props} />
));
DaisyDialogFooter.displayName = 'DaisyDialogFooter';

// Tabs Components
export const DaisyTabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('tabs', className)} {...props} />
);
DaisyTabs.displayName = 'DaisyTabs';

export const DaisyTabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('tabs-boxed', className)} {...props} />
  )
);
DaisyTabsList.displayName = 'DaisyTabsList';

export const DaisyTabsTrigger = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => <a ref={ref} className={cn('tab', className)} {...props} />);
DaisyTabsTrigger.displayName = 'DaisyTabsTrigger';

export const DaisyTabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('tab-content', className)} {...props} />
));
DaisyTabsContent.displayName = 'DaisyTabsContent';

// Select Components
export const DaisySelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn('select select-bordered w-full', className)} {...props} />
));
DaisySelect.displayName = 'DaisySelect';

export const DaisySelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('select select-bordered w-full flex items-center', className)}
    {...props}
  />
));
DaisySelectTrigger.displayName = 'DaisySelectTrigger';

export const DaisySelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52', className)}
    {...props}
  />
));
DaisySelectContent.displayName = 'DaisySelectContent';

export const DaisySelectItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />);
DaisySelectItem.displayName = 'DaisySelectItem';

export const DaisySelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn('flex-1', className)} {...props} />
));
DaisySelectValue.displayName = 'DaisySelectValue';

// Dropdown Components
export const DaisyDropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('dropdown', className)} {...props} />
));
DaisyDropdownMenu.displayName = 'DaisyDropdownMenu';

export const DaisyDropdownMenuTrigger = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label ref={ref} tabIndex={0} className={cn('btn m-1', className)} {...props} />
));
DaisyDropdownMenuTrigger.displayName = 'DaisyDropdownMenuTrigger';

export const DaisyDropdownMenuContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    tabIndex={0}
    className={cn('dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52', className)}
    {...props}
  />
));
DaisyDropdownMenuContent.displayName = 'DaisyDropdownMenuContent';

export const DaisyDropdownMenuItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />);
DaisyDropdownMenuItem.displayName = 'DaisyDropdownMenuItem';

// Accordion Components
export const DaisyAccordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('collapse collapse-arrow bg-base-200', className)} {...props} />
));
DaisyAccordion.displayName = 'DaisyAccordion';

export const DaisyAccordionTrigger = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} type="checkbox" className={cn('', className)} {...props} />
));
DaisyAccordionTrigger.displayName = 'DaisyAccordionTrigger';

export const DaisyAccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('collapse-content', className)} {...props} />
));
DaisyAccordionContent.displayName = 'DaisyAccordionContent';

export const DaisyAccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('collapse collapse-arrow bg-base-200', className)} {...props} />
));
DaisyAccordionItem.displayName = 'DaisyAccordionItem';

// Calendar Component
export const DaisyCalendar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('calendar bg-base-100 rounded-box shadow', className)}
      {...props}
    />
  )
);
DaisyCalendar.displayName = 'DaisyCalendar';

// Skeleton Component
export const DaisySkeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('skeleton', className)} {...props} />
  )
);
DaisySkeleton.displayName = 'DaisySkeleton';

// Tooltip Component
export const DaisyTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tip?: string }
>(({ className, tip, ...props }, ref) => (
  <div ref={ref} className={cn('tooltip', className)} data-tip={tip} {...props} />
));
DaisyTooltip.displayName = 'DaisyTooltip';

// Popover Component
export const DaisyPopover = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('dropdown', className)} {...props} />
  )
);
DaisyPopover.displayName = 'DaisyPopover';

// Table Components
export const DaisyTable = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table ref={ref} className={cn('table', className)} {...props} />
));
DaisyTable.displayName = 'DaisyTable';

export const DaisyTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <thead ref={ref} className={cn('', className)} {...props} />);
DaisyTableHeader.displayName = 'DaisyTableHeader';

export const DaisyTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <tbody ref={ref} className={cn('', className)} {...props} />);
DaisyTableBody.displayName = 'DaisyTableBody';

export const DaisyTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => <tr ref={ref} className={cn('', className)} {...props} />);
DaisyTableRow.displayName = 'DaisyTableRow';

export const DaisyTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => <th ref={ref} className={cn('', className)} {...props} />);
DaisyTableHead.displayName = 'DaisyTableHead';

export const DaisyTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => <td ref={ref} className={cn('', className)} {...props} />);
DaisyTableCell.displayName = 'DaisyTableCell';
