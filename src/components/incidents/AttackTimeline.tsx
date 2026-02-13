/**
 * Attack Timeline Component
 * 
 * Visualizes the chronological sequence of security events within an incident.
 * This is a read-only UI component that doesn't modify incident data.
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Clock, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { SourceBadge } from '@/components/common/SourceBadge';

// Helper function for card-like styling to ensure independence
const Card = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>
        {children}
    </div>
);

interface AttackTimelineProps {
    incidentId: string;
    alerts: any[]; // Accept any alert type
    severity?: string;
}

export function AttackTimeline({ incidentId, alerts, severity }: AttackTimelineProps) {
    // Helper to get normalized data
    const getAlertTime = (alert: any) => {
        const val = alert.created_at || alert.createdAt;
        return val ? new Date(val).getTime() : Date.now();
    };

    const getRawData = (alert: any) => {
        const val = alert.raw_data || alert.rawData;
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return {}; }
        }
        return val || {};
    };

    // Generate mock alerts logic removed (handled in parent Modal)
    let displayAlerts = [...alerts];


    // Sort alerts chronologically
    const sortedAlerts = [...displayAlerts].sort((a, b) =>
        getAlertTime(a) - getAlertTime(b)
    );

    // Detect escalation pattern
    const severityOrder: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const isEscalating = sortedAlerts.some((alert, index) => {
        if (index === 0) return false;
        const curr = severityOrder[alert.severity as string] || 0;
        const prev = severityOrder[sortedAlerts[index - 1].severity as string] || 0;
        return curr > prev;
    });

    if (sortedAlerts.length === 0) {
        return (
            <Card className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                    No alerts associated with this incident yet.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Escalation Warning */}
            {isEscalating && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-severity-high/10 border border-severity-high/30 rounded-lg p-4"
                >
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-severity-high" />
                        <div>
                            <p className="font-semibold text-severity-high">Escalating Attack Pattern Detected</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Alert severity is increasing over time, indicating potential attack progression.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Timeline */}
            <div className="relative space-y-6">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-8 bottom-8 w-[2px] bg-border" />

                {sortedAlerts.map((alert, index) => {
                    const isFirst = index === 0;
                    const isLast = index === sortedAlerts.length - 1;
                    const timestamp = getAlertTime(alert);
                    const rawData = getRawData(alert);

                    // Severity color mapping
                    const severityColors: Record<string, string> = {
                        critical: 'bg-severity-critical border-severity-critical',
                        high: 'bg-severity-high border-severity-high',
                        medium: 'bg-severity-medium border-severity-medium',
                        low: 'bg-severity-low border-severity-low',
                        info: 'bg-blue-500 border-blue-500'
                    };

                    const dotColor = severityColors[alert.severity as string] || severityColors.info;

                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="relative pl-12"
                        >
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1">
                                <div className={`relative flex h-8 w-8 items-center justify-center`}>
                                    <div className={`h-4 w-4 rounded-full border-2 ${dotColor}`} />
                                    {isFirst && (
                                        <div className="absolute h-4 w-4 rounded-full border-2 border-green-500 bg-green-500/20 animate-pulse" />
                                    )}
                                    {isLast && !isFirst && (
                                        <div className="absolute h-4 w-4 rounded-full border-2 border-orange-500 bg-orange-500/20" />
                                    )}
                                </div>
                            </div>

                            {/* Alert Card */}
                            <Card className="p-4 hover:border-primary/50 transition-colors">
                                <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <SeverityBadge severity={alert.severity as any} size="sm" />
                                                <SourceBadge alert={alert} variant="compact" />
                                                {isFirst && (
                                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                        Initial Detection
                                                    </span>
                                                )}
                                                {isLast && !isFirst && (
                                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-foreground">{alert.title}</h4>
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <time dateTime={new Date(timestamp).toISOString()}>
                                            {format(new Date(timestamp), 'PPpp')}
                                        </time>
                                    </div>

                                    {/* Source */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="font-mono text-xs text-muted-foreground">{alert.source}</span>
                                    </div>

                                    {/* MITRE Techniques (if available) */}
                                    {rawData?.mitre_techniques && rawData.mitre_techniques.length > 0 && (
                                        <div className="pt-2 border-t">
                                            <p className="text-xs text-muted-foreground mb-1.5">MITRE ATT&CK</p>
                                            <div className="flex flex-wrap gap-1">
                                                {rawData.mitre_techniques.map((tech: string, i: number) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary */}
            <Card className="p-4 bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-semibold">{sortedAlerts.length}</span>
                </div>
                {sortedAlerts.length > 1 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Time Span</span>
                        <span className="font-mono text-xs">
                            {format(new Date(getAlertTime(sortedAlerts[0])), 'PPp')} →{' '}
                            {format(new Date(getAlertTime(sortedAlerts[sortedAlerts.length - 1])), 'PPp')}
                        </span>
                    </div>
                )}
            </Card>
        </div>
    );
}
