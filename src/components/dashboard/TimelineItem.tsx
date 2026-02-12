import { motion } from 'framer-motion';
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  RefreshCw,
  UserPlus,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Activity } from '@/context/ActivityContext';

interface TimelineItemProps {
  event: Activity;
  isLast?: boolean;
  index?: number;
}

export function TimelineItem({ event, isLast = false, index = 0 }: TimelineItemProps) {
  const createdAt = new Date(event.created_at);

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm');
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM d');
  };

  const getEventIcon = () => {
    switch (event.type) {
      case 'alert':
        return AlertTriangle;
      case 'evidence':
        return FileText;
      case 'note':
        return MessageSquare;
      case 'status_change':
        return RefreshCw;
      case 'assignment':
        return UserPlus;
      default:
        return Zap;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'alert':
        return 'bg-severity-high/20 text-severity-high border-severity-high/30';
      case 'evidence':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'status_change':
        return 'bg-status-investigating/20 text-status-investigating border-status-investigating/30';
      case 'note':
        return 'bg-severity-info/20 text-severity-info border-severity-info/30';
      default:
        return 'bg-secondary text-foreground border-border';
    }
  };

  const Icon = getEventIcon();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="relative flex gap-4"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 h-[calc(100%-10px)] w-px bg-border" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
          getEventColor()
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-medium text-sm text-foreground">{event.title}</p>
            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-xs text-muted-foreground">
              {formatTime(createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(createdAt)}
            </p>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          by <span className="text-foreground">{event.user_name}</span>
        </p>
      </div>
    </motion.div>
  );
}
