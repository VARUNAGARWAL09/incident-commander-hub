import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  ArrowUpRight,
  Play,
  Pause,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { IncidentRow } from '@/components/dashboard/IncidentRow';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SeverityChart } from '@/components/dashboard/SeverityChart';
import { TeamStatus } from '@/components/dashboard/TeamStatus';
import { DashboardFilters, type DashboardFilterValues } from '@/components/dashboard/DashboardFilters';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIncidents } from '@/context/IncidentsContext';
import { useActivity } from '@/context/ActivityContext';
import { useSimulation } from '@/context/SimulationContext';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  mockUsers,
} from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const { incidents, loading } = useIncidents();
  const { activities } = useActivity();
  const { isRunning, virtualTime, alerts, evidence, startSimulation, stopSimulation, avgResponseTime } = useSimulation();
  const [filters, setFilters] = useState<DashboardFilterValues>({
    severity: 'all',
    status: 'all',
    timeRange: 'all',
  });
  const [statDialogOpen, setStatDialogOpen] = useState(false);
  const [statDialogType, setStatDialogType] = useState<'open' | 'alerts' | 'response' | 'resolved'>('open');

  // Calculate real stats from incidents and simulation
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const openIncidents = incidents.filter(
      i => i.status === 'open' || i.status === 'investigating'
    );

    const criticalOpen = openIncidents.filter(i => i.severity === 'critical');

    const resolvedToday = incidents.filter(i => {
      if (i.status !== 'resolved' && i.status !== 'closed') return false;
      const closedDate = i.closed_at ? new Date(i.closed_at) : new Date(i.updated_at);
      return closedDate >= todayStart;
    });

    // Real alerts from simulation
    const alertsToday = alerts.filter(a => {
      const alertDate = new Date(a.created_at);
      return alertDate >= todayStart;
    }).length;

    const unacknowledgedAlerts = alerts.filter(a => a.status === 'pending').length;

    return {
      openCount: incidents.length, // Show real incident count
      criticalCount: criticalOpen.length,
      alertsToday: alertsToday || alerts.length,
      unacknowledgedAlerts,
      avgResponseTime,
      resolvedToday: resolvedToday.length,
      evidenceCount: evidence.length,
      openIncidents,
      resolvedIncidents: resolvedToday,
      allAlerts: alerts,
    };
  }, [incidents, alerts, evidence, avgResponseTime]);

  const filteredIncidents = incidents.filter(incident => {
    const matchesSeverity = filters.severity === 'all' || incident.severity === filters.severity;
    const matchesStatus = filters.status === 'all' || incident.status === filters.status;
    const isOpenOrInvestigating = incident.status === 'open' || incident.status === 'investigating';
    return matchesSeverity && matchesStatus && isOpenOrInvestigating;
  });

  // Get recent alerts from simulation
  const recentAlerts = alerts.slice(0, 4);

  const handleStatClick = (type: 'open' | 'alerts' | 'response' | 'resolved') => {
    setStatDialogType(type);
    setStatDialogOpen(true);
  };

  const getStatDialogContent = () => {
    switch (statDialogType) {
      case 'open':
        return {
          title: `Open Incidents (${stats.openCount})`,
          content: stats.openIncidents.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats.openIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setStatDialogOpen(false);
                    navigate('/incidents');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={inc.severity} size="sm" />
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{inc.case_number}</p>
                      <p className="text-sm font-medium">{inc.title}</p>
                    </div>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No open incidents</p>
          ),
        };
      case 'alerts':
        return {
          title: `Alerts Today (${stats.alertsToday})`,
          content: (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats.allAlerts.length > 0 ? stats.allAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setStatDialogOpen(false);
                    navigate('/alerts');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={alert.severity} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.source}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${alert.status === 'acknowledged' || alert.status === 'resolved' ? 'bg-muted text-muted-foreground' : 'bg-severity-high/20 text-severity-high'}`}>
                    {alert.status === 'pending' ? 'Pending' : alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">No alerts yet. Simulation is generating alerts...</p>
              )}
            </div>
          ),
        };
      case 'response':
        return {
          title: 'Average Response Time',
          content: (
            <div className="text-center py-8">
              <p className="font-mono text-5xl font-bold text-primary mb-2">{stats.avgResponseTime}</p>
              <p className="text-muted-foreground">Average time to first response</p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-status-resolved/10">
                  <p className="font-mono text-lg font-bold text-status-resolved">&lt;5m</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="font-mono text-lg font-bold text-primary">&lt;15m</p>
                  <p className="text-xs text-muted-foreground">High</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-mono text-lg font-bold">&lt;1h</p>
                  <p className="text-xs text-muted-foreground">Medium</p>
                </div>
              </div>
            </div>
          ),
        };
      case 'resolved':
        return {
          title: `Resolved Today (${stats.resolvedToday})`,
          content: stats.resolvedIncidents.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats.resolvedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-status-resolved" />
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{inc.case_number}</p>
                      <p className="text-sm font-medium">{inc.title}</p>
                    </div>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No incidents resolved today</p>
          ),
        };
      default:
        return { title: '', content: null };
    }
  };

  const dialogContent = getStatDialogContent();

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
            >
              Security Operations Center
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground mt-1 text-sm"
            >
              Real-time incident monitoring
            </motion.p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Simulation Controls */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={isRunning ? stopSimulation : startSimulation}
            >
              {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>

            {/* Virtual Time Display */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 font-mono text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{format(virtualTime, 'HH:mm:ss')}</span>
            </div>

            <div className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5",
              isRunning ? "bg-primary/10" : "bg-destructive/10"
            )}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full ${isRunning ? 'animate-ping bg-primary opacity-75' : 'bg-destructive'}`}></span>
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isRunning ? 'bg-primary' : 'bg-destructive'}`}></span>
              </span>
              <span className={`text-xs font-medium ${isRunning ? 'text-primary' : 'text-destructive'}`}>
                {isRunning ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
            <DashboardFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Open Incidents"
            value={stats.openCount}
            subtitle={`${stats.criticalCount} critical`}
            icon={AlertTriangle}
            variant="danger"
            onClick={() => handleStatClick('open')}
          />
          <StatCard
            title="Alerts Today"
            value={stats.alertsToday}
            subtitle={`${stats.unacknowledgedAlerts} unacknowledged`}
            icon={TrendingUp}
            variant="warning"
            onClick={() => handleStatClick('alerts')}
          />
          <StatCard
            title="Avg Response Time"
            value={stats.avgResponseTime}
            subtitle="Target: <15m"
            icon={Clock}
            variant="primary"
            onClick={() => handleStatClick('response')}
          />
          <StatCard
            title="Resolved Today"
            value={stats.resolvedToday}
            subtitle={`${stats.evidenceCount} evidence items`}
            icon={CheckCircle}
            onClick={() => handleStatClick('resolved')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Incidents List - Takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-2 rounded-xl border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
                  Active Incidents
                </h3>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  {filteredIncidents.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => navigate('/incidents')}
              >
                View All
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="divide-y divide-border/50">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredIncidents.length > 0 ? (
                filteredIncidents.slice(0, 5).map((incident, index) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    index={index}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No incidents match your filters</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
                    Recent Alerts
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {recentAlerts.map((alert, index) => (
                  <AlertCard key={alert.id} alert={alert} index={index} />
                ))}
              </div>
            </motion.div>

            {/* Team Status */}
            <TeamStatus users={mockUsers} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <ActivityFeed events={activities.slice(0, 10)} />
          </div>

          {/* Severity Chart */}
          <SeverityChart incidents={incidents} />
        </div>
      </div>

      {/* Stat Detail Dialog */}
      <Dialog open={statDialogOpen} onOpenChange={setStatDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-mono">{dialogContent.title}</DialogTitle>
          </DialogHeader>
          {dialogContent.content}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Index;