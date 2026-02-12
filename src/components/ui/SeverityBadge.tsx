import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { Severity } from '@/types/incident';

const severityBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium font-mono uppercase tracking-wider transition-colors',
  {
    variants: {
      severity: {
        critical: 'severity-critical',
        high: 'severity-high',
        medium: 'severity-medium',
        low: 'severity-low',
        info: 'severity-info',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        default: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      severity: 'info',
      size: 'default',
    },
  }
);

interface SeverityBadgeProps extends VariantProps<typeof severityBadgeVariants> {
  severity: Severity;
  showDot?: boolean;
  className?: string;
}

export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, size, showDot = true, className }, ref) => {
    return (
      <span ref={ref} className={cn(severityBadgeVariants({ severity, size }), className)}>
        {showDot && (
          <span 
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              severity === 'critical' && 'bg-severity-critical animate-pulse',
              severity === 'high' && 'bg-severity-high',
              severity === 'medium' && 'bg-severity-medium',
              severity === 'low' && 'bg-severity-low',
              severity === 'info' && 'bg-severity-info'
            )} 
          />
        )}
        {severity}
      </span>
    );
  }
);

SeverityBadge.displayName = 'SeverityBadge';
