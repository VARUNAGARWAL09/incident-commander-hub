import { motion } from 'framer-motion';
import { Users, Circle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/types/incident';

interface TeamStatusProps {
  users: User[];
}

export function TeamStatus({ users }: TeamStatusProps) {
  const getStatusColor = (lastActive?: Date) => {
    if (!lastActive) return 'bg-muted-foreground';
    const diff = Date.now() - lastActive.getTime();
    if (diff < 300000) return 'bg-status-open'; // 5 minutes
    if (diff < 1800000) return 'bg-status-investigating'; // 30 minutes
    return 'bg-status-closed';
  };

  const getStatusText = (lastActive?: Date) => {
    if (!lastActive) return 'Offline';
    const diff = Date.now() - lastActive.getTime();
    if (diff < 300000) return 'Online';
    if (diff < 1800000) return 'Away';
    return 'Offline';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
          Team Status
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {users.filter(u => {
            const diff = u.lastActive ? Date.now() - u.lastActive.getTime() : Infinity;
            return diff < 1800000;
          }).length} online
        </span>
      </div>

      <div className="p-4 space-y-3">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-medium">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                  getStatusColor(user.lastActive)
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Circle className={cn('h-2 w-2 fill-current', getStatusColor(user.lastActive))} />
              <span>{getStatusText(user.lastActive)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
