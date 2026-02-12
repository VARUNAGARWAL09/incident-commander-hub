import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSLA, formatTimeRemaining, type SLAStatus } from '@/hooks/useSLA';

interface SLAIndicatorProps {
  severity: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  closedAt?: string | null;
  showDetails?: boolean;
  size?: 'sm' | 'md';
}

export function SLAIndicator({
  severity,
  createdAt,
  acknowledgedAt,
  closedAt,
  showDetails = false,
  size = 'sm',
}: SLAIndicatorProps) {
  const { calculateSLAStatus } = useSLA();
  const slaStatus = calculateSLAStatus(severity, createdAt, acknowledgedAt || null, closedAt || null);

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const getStatusConfig = (status: SLAStatus['status']) => {
    switch (status) {
      case 'on_track':
        return {
          icon: <CheckCircle className={cn(iconSize, 'text-green-500')} />,
          label: 'On Track',
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-500',
          borderColor: 'border-green-500/30',
        };
      case 'at_risk':
        return {
          icon: <AlertTriangle className={cn(iconSize, 'text-yellow-500')} />,
          label: 'At Risk',
          bgColor: 'bg-yellow-500/10',
          textColor: 'text-yellow-500',
          borderColor: 'border-yellow-500/30',
        };
      case 'breached':
        return {
          icon: <XCircle className={cn(iconSize, 'text-red-500')} />,
          label: 'Breached',
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-500',
          borderColor: 'border-red-500/30',
        };
    }
  };

  const config = getStatusConfig(slaStatus.status);

  // If incident is resolved, show completed state
  if (slaStatus.isResolved) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5',
              'bg-green-500/10 border-green-500/30'
            )}
          >
            <CheckCircle className={cn(iconSize, 'text-green-500')} />
            {showDetails && <span className="text-xs font-medium text-green-500">Resolved</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Incident resolved within SLA</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5',
            config.bgColor,
            config.borderColor
          )}
        >
          {config.icon}
          {showDetails && (
            <span className={cn('text-xs font-medium', config.textColor)}>
              {config.label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-medium">{config.label}</p>
          {!slaStatus.isAcknowledged && slaStatus.timeToAcknowledge !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Acknowledge: {formatTimeRemaining(slaStatus.timeToAcknowledge)}
              </span>
            </div>
          )}
          {slaStatus.isAcknowledged && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Acknowledged</span>
            </div>
          )}
          {!slaStatus.isResolved && slaStatus.timeToResolve !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Resolve: {formatTimeRemaining(slaStatus.timeToResolve)}
              </span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
