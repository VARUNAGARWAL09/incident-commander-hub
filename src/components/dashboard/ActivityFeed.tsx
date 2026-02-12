import { motion } from 'framer-motion';
import { Activity as ActivityIcon } from 'lucide-react';
import { TimelineItem } from './TimelineItem';
import type { Activity } from '@/context/ActivityContext';

interface ActivityFeedProps {
  events: Activity[];
  title?: string;
}

export function ActivityFeed({ events, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <ActivityIcon className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
          {title}
        </h3>
      </div>

      <div className="p-5 max-h-[400px] overflow-y-auto scrollbar-thin">
        {events.length > 0 ? (
          <div className="space-y-0">
            {events.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={index === events.length - 1}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ActivityIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
