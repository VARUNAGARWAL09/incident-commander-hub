import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:border-primary/30',
        variant === 'primary' && 'border-primary/20 bg-primary/5',
        variant === 'danger' && 'border-severity-critical/20 bg-severity-critical/5',
        variant === 'warning' && 'border-severity-high/20 bg-severity-high/5',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
    >
      {/* Background glow effect */}
      <div
        className={cn(
          'absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl',
          variant === 'default' && 'bg-primary',
          variant === 'primary' && 'bg-primary',
          variant === 'danger' && 'bg-severity-critical',
          variant === 'warning' && 'bg-severity-high'
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-status-resolved' : 'text-severity-critical'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%{' '}
              <span className="text-muted-foreground">vs last period</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            variant === 'default' && 'bg-primary/10 text-primary',
            variant === 'primary' && 'bg-primary/20 text-primary',
            variant === 'danger' && 'bg-severity-critical/20 text-severity-critical',
            variant === 'warning' && 'bg-severity-high/20 text-severity-high'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}