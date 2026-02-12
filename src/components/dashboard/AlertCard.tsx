import { motion } from 'framer-motion';
import { AlertTriangle, Check, Clock, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { SourceBadge } from '@/components/common/SourceBadge';
import { useState } from 'react';
import type { Alert as SimulationAlert } from '@/context/SimulationContext';
import type { Alert as MockAlert } from '@/types/incident';

type Alert = SimulationAlert | MockAlert;

interface AlertCardProps {
  alert: Alert;
  index?: number;
  showDetails?: boolean;
}

// Type guard to check if it's a simulation alert
function isSimulationAlert(alert: Alert): alert is SimulationAlert {
  return 'status' in alert && typeof alert.status === 'string';
}

interface AnalysisResult {
  risk_score: number;
  confidence: number;
  detection_reasons: string[];
  mitre_techniques: string[];
  recommended_actions: string[];
}

export function AlertCard({ alert, index = 0, showDetails = false }: AlertCardProps) {
  const [expanded, setExpanded] = useState(showDetails);

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };

  const severity = alert.severity;
  const isAcknowledged = isSimulationAlert(alert)
    ? alert.status === 'acknowledged' || alert.status === 'resolved'
    : alert.acknowledged;
  const createdAt = isSimulationAlert(alert) ? alert.created_at : alert.createdAt;
  const source = isSimulationAlert(alert) ? alert.source : alert.source;

  // Extract analysis data from raw_data if available
  const rawData = isSimulationAlert(alert) ? (alert as any).raw_data : alert.rawData;
  const analysis: AnalysisResult | null = rawData?.analysis || null;
  const riskScore = analysis?.risk_score;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className={cn(
        'group relative rounded-lg border bg-card p-4 transition-all hover:border-primary/30',
        !isAcknowledged && 'border-l-2 border-l-severity-high'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-lg p-2',
            severity === 'critical' && 'bg-severity-critical/15 text-severity-critical',
            severity === 'high' && 'bg-severity-high/15 text-severity-high',
            severity === 'medium' && 'bg-severity-medium/15 text-severity-medium',
            severity === 'low' && 'bg-severity-low/15 text-severity-low'
          )}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm text-foreground truncate">
              {alert.title}
            </p>
            <div className="flex items-center gap-2">
              {riskScore !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold",
                  riskScore >= 70 && "bg-severity-critical/15 text-severity-critical",
                  riskScore >= 50 && riskScore < 70 && "bg-severity-high/15 text-severity-high",
                  riskScore >= 30 && riskScore < 50 && "bg-severity-medium/15 text-severity-medium",
                  riskScore < 30 && "bg-severity-low/15 text-severity-low"
                )}>
                  <Shield className="h-3 w-3" />
                  {riskScore}
                </div>
              )}
              <SeverityBadge severity={severity} size="sm" showDot={false} />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-mono">{source}</span>
              <SourceBadge alert={alert} variant="compact" showIcon={true} />
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(createdAt)}
            </span>
          </div>

          {isAcknowledged && (
            <div className="flex items-center gap-1.5 text-xs text-status-resolved">
              <Check className="h-3 w-3" />
              <span>Acknowledged</span>
            </div>
          )}

          {/* Detection reasons preview */}
          {analysis?.detection_reasons && analysis.detection_reasons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground line-clamp-1">
                {analysis.detection_reasons[0]}
              </p>
            </div>
          )}

          {/* Expandable details */}
          {analysis && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Hide details' : 'Show detection details'}
            </button>
          )}

          {expanded && analysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-border space-y-3"
            >
              {/* Risk Score Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className="font-mono font-semibold">{analysis.risk_score}/100</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      analysis.risk_score >= 70 && "bg-severity-critical",
                      analysis.risk_score >= 50 && analysis.risk_score < 70 && "bg-severity-high",
                      analysis.risk_score >= 30 && analysis.risk_score < 50 && "bg-severity-medium",
                      analysis.risk_score < 30 && "bg-severity-low"
                    )}
                    style={{ width: `${analysis.risk_score}%` }}
                  />
                </div>
              </div>

              {/* Detection Reasons */}
              {analysis.detection_reasons.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Detection Reasons</p>
                  <ul className="space-y-1">
                    {analysis.detection_reasons.map((reason, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* MITRE Techniques */}
              {analysis.mitre_techniques && analysis.mitre_techniques.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">MITRE ATT&CK</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.mitre_techniques.map((tech, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Recommended Actions</p>
                  <ul className="space-y-1">
                    {analysis.recommended_actions.map((action, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <span className="font-mono font-semibold">{analysis.confidence}%</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {!isAcknowledged && (
        <div className="absolute right-3 top-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-high opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-severity-high"></span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
