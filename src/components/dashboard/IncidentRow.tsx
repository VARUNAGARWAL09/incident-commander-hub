import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users, FileText, Bell, MoreVertical, Eye, Edit, Download, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncidents, type Incident, type IncidentStatus } from '@/context/IncidentsContext';
import { useSimulation } from '@/context/SimulationContext';
import { useToast } from '@/hooks/use-toast';
import { IncidentReportDialog } from '@/components/reports/IncidentReportDialog';
import { AttackTimeline } from '@/components/incidents/AttackTimeline';
import { SLAIndicator } from '@/components/sla/SLAIndicator';

interface IncidentRowProps {
  incident: Incident;
  onClick?: () => void;
  index?: number;
  viewMode?: 'list' | 'grid';
}

export function IncidentRow({ incident, onClick, index = 0, viewMode = 'list' }: IncidentRowProps) {
  const navigate = useNavigate();
  const { updateIncident } = useIncidents();
  const { alerts } = useSimulation(); // Access alerts
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  // Filter alerts for this incident
  const incidentAlerts = alerts.filter(a => a.incident_id === incident.id);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRowClick = () => {
    if (onClick) {
      onClick();
    } else {
      setDetailsOpen(true);
    }
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    try {
      await updateIncident(incident.id, {
        status: newStatus,
        closed_at: (newStatus === 'resolved' || newStatus === 'closed') ? new Date().toISOString() : null
      });
      toast({
        title: 'Status Updated',
        description: `${incident.case_number} is now ${newStatus}`,
      });
      setEditingStatus(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (viewMode === 'grid') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.01 }}
          onClick={handleRowClick}
          className={cn(
            'group cursor-pointer rounded-xl border bg-card p-4 transition-all hover:shadow-lg hover:border-primary/50',
            incident.severity === 'critical' && 'border-l-4 border-l-severity-critical'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="font-mono text-sm font-semibold text-primary">{incident.case_number}</p>
            <SeverityBadge severity={incident.severity} size="sm" />
          </div>
          <h3 className="font-medium text-sm mb-2 line-clamp-2">{incident.title}</h3>
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={incident.status} />
            <SLAIndicator
              severity={incident.severity}
              createdAt={incident.created_at}
              closedAt={incident.closed_at}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Bell className="h-3 w-3" />{incident.alert_count}</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{incident.evidence_count}</span>
            </div>
            <span className="font-mono">{formatTimeAgo(incident.updated_at)}</span>
          </div>
        </motion.div>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-3">
                <span className="text-primary">{incident.case_number}</span>
                <SeverityBadge severity={incident.severity} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{incident.title}</h3>
                <p className="text-muted-foreground mt-1">{incident.description || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={incident.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-mono">{new Date(incident.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => { setDetailsOpen(false); setEditingStatus(true); }}>Change Status</Button>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Status Dialog */}
        <Dialog open={editingStatus} onOpenChange={setEditingStatus}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Change status for <span className="font-mono text-primary">{incident.case_number}</span>
              </p>
              <Select defaultValue={incident.status} onValueChange={(v) => handleStatusChange(v as IncidentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="contained">Contained</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.01 }}
        onClick={handleRowClick}
        className={cn(
          'group flex cursor-pointer items-center border-b border-border/50 p-4 transition-all gap-3',
          'hover:bg-accent/50',
          incident.severity === 'critical' && 'border-l-2 border-l-severity-critical'
        )}
      >
        {/* Case Number & Severity */}
        <div className="w-[90px] shrink-0 space-y-1">
          <p className="font-mono text-xs font-semibold text-primary">
            {incident.case_number}
          </p>
          <SeverityBadge severity={incident.severity} size="sm" />
        </div>

        {/* Title & Tags */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="truncate font-medium text-sm text-foreground group-hover:text-primary transition-colors">
            {incident.title}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {incident.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-[80px]"
              >
                {tag}
              </span>
            ))}
            {incident.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{incident.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Status & SLA */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <StatusBadge status={incident.status} />
          <SLAIndicator
            severity={incident.severity}
            createdAt={incident.created_at}
            closedAt={incident.closed_at}
          />
        </div>

        {/* Metrics */}
        <div className="hidden md:flex items-center gap-3 text-muted-foreground shrink-0">
          <div className="flex items-center gap-1 text-xs">
            <Bell className="h-3.5 w-3.5" />
            <span>{incident.alert_count}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span>{incident.evidence_count}</span>
          </div>
        </div>

        {/* Unassigned placeholder */}
        <div className="hidden lg:flex items-center shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Unassigned</span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border border-border">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDetailsOpen(true); }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingStatus(true); }}>
              <Edit className="h-4 w-4 mr-2" />
              Change Status
            </DropdownMenuItem>
            <IncidentReportDialog
              incident={incident}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary hidden sm:block shrink-0" />
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-3">
              <span className="text-primary">{incident.case_number}</span>
              <SeverityBadge severity={incident.severity} />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{incident.title}</h3>
              <p className="text-muted-foreground mt-1">{incident.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={incident.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-mono">{new Date(incident.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-sm font-semibold">{incident.alert_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Evidence</p>
                <p className="text-sm font-semibold">{incident.evidence_count}</p>
              </div>
            </div>

            {incident.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {incident.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={() => { setDetailsOpen(false); setEditingStatus(true); }}>
                Change Status
              </Button>
              <Button
                variant="secondary"
                onClick={() => setTimelineOpen(true)}
                disabled={incidentAlerts.length === 0}
              >
                <Clock className="h-4 w-4 mr-2" />
                Attack Timeline
              </Button>
              <IncidentReportDialog
                incident={incident}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Generate Report
                  </Button>
                }
              />
              <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attack Timeline Dialog */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Attack Timeline
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <AttackTimeline incidentId={incident.id} alerts={incidentAlerts} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={editingStatus} onOpenChange={setEditingStatus}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Change status for <span className="font-mono text-primary">{incident.case_number}</span>
              </p>
              <Select defaultValue={incident.status} onValueChange={(v) => handleStatusChange(v as IncidentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="contained">Contained</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
