import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { IncidentStatus } from '@/types/incident';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium capitalize transition-colors',
  {
    variants: {
      status: {
        open: 'status-open',
        investigating: 'status-investigating',
        contained: 'status-contained',
        resolved: 'status-resolved',
        closed: 'status-closed',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        default: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      status: 'open',
      size: 'default',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: IncidentStatus;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size, 
  showDot = true, 
  className 
}: StatusBadgeProps) {
  const statusLabels: Record<IncidentStatus, string> = {
    open: 'Open',
    investigating: 'Investigating',
    contained: 'Contained',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    <span className={cn(statusBadgeVariants({ status, size }), className)}>
      {showDot && (
        <span 
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'open' && 'bg-status-open animate-pulse',
            status === 'investigating' && 'bg-status-investigating animate-pulse',
            status === 'contained' && 'bg-status-contained',
            status === 'resolved' && 'bg-status-resolved',
            status === 'closed' && 'bg-status-closed'
          )} 
        />
      )}
      {statusLabels[status]}
    </span>
  );
}
