import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Filter,
  Search,
  Bell,
  BellOff,
  ArrowUpDown,
  Play,
  CheckCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSimulation } from '@/context/SimulationContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Severity } from '@/types/incident';

const Alerts = () => {
  const { alerts, acknowledgeAlert, resolveAlert, escalateToIncident } = useSimulation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;

    const matchesTab = activeTab === 'all' ||
      (activeTab === 'pending' && alert.status === 'pending') ||
      (activeTab === 'acknowledged' && alert.status === 'acknowledged') ||
      (activeTab === 'resolved' && alert.status === 'resolved');

    return matchesSearch && matchesSeverity && matchesTab;
  });

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  const handleAcknowledgeSelected = async () => {
    const pendingSelected = selectedAlerts.filter(id => {
      const alert = alerts.find(a => a.id === id);
      return alert?.status === 'pending';
    });

    for (const id of pendingSelected) {
      await acknowledgeAlert(id);
    }

    toast({
      title: 'Alerts Acknowledged',
      description: `${pendingSelected.length} alerts have been acknowledged`,
    });
    setSelectedAlerts([]);
  };

  const handleEscalate = async (alertId: string) => {
    setEscalatingId(alertId);
    try {
      const incidentId = await escalateToIncident(alertId);
      if (incidentId) {
        toast({
          title: 'Alert Escalated',
          description: 'Created new incident from this alert',
        });
        // Navigate to incidents page
        navigate('/incidents');
      } else {
        toast({
          title: 'Escalation Failed',
          description: 'Could not create incident from alert',
          variant: 'destructive',
        });
      }
    } finally {
      setEscalatingId(null);
    }
  };

  const handleBulkEscalate = async () => {
    const criticalSelected = selectedAlerts.filter(id => {
      const alert = alerts.find(a => a.id === id);
      return alert && (alert.severity === 'critical' || alert.severity === 'high');
    });

    for (const id of criticalSelected) {
      await escalateToIncident(id);
    }

    toast({
      title: 'Alerts Escalated',
      description: `${criticalSelected.length} alerts escalated to incidents`,
    });
    setSelectedAlerts([]);
    navigate('/incidents');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-2xl font-bold tracking-tight"
            >
              Alert Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Triage, acknowledge, and escalate security alerts
            </motion.p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleBulkEscalate}
              disabled={selectedAlerts.length === 0}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Escalate Selected
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleAcknowledgeSelected}
              disabled={selectedAlerts.length === 0}
            >
              <Check className="h-4 w-4" />
              Acknowledge ({selectedAlerts.length})
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-wrap items-center gap-4">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="all" className="gap-2">
                <Bell className="h-4 w-4" />
                All Alerts
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                  {alerts.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending
                <span className="ml-1 rounded-full bg-severity-high/20 text-severity-high px-1.5 py-0.5 text-[10px] font-semibold">
                  {pendingCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="acknowledged" className="gap-2">
                <BellOff className="h-4 w-4" />
                Acknowledged
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                  {acknowledgedCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved
                <span className="ml-1 rounded-full bg-green-500/20 text-green-500 px-1.5 py-0.5 text-[10px] font-semibold">
                  {resolvedCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-3 mt-4"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>

            <Select
              value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value as Severity | 'all')}
            >
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <p>
              Showing <span className="font-semibold text-foreground">{filteredAlerts.length}</span> alerts
            </p>
          </div>

          {/* Alerts Grid */}
          <TabsContent value={activeTab} className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, index) => (
                  <div key={alert.id} className="relative">
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlerts(prev =>
                          prev.includes(alert.id)
                            ? prev.filter(id => id !== alert.id)
                            : [...prev, alert.id]
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => { }}
                        className="h-4 w-4 rounded border-border"
                      />
                    </div>
                    <div className="pl-6">
                      <AlertCard alert={alert} index={index} />
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-2 pl-6">
                      {alert.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs flex-1"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <Check className="h-3 w-3" />
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1 text-xs flex-1"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Resolve
                          </Button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && !alert.incident_id && (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1 text-xs flex-1"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Resolve
                        </Button>
                      )}
                      {/* Escalate button for critical/high severity alerts not yet linked to incident */}
                      {(alert.severity === 'critical' || alert.severity === 'high') &&
                        !alert.incident_id &&
                        alert.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1 text-xs flex-1"
                            onClick={() => handleEscalate(alert.id)}
                            disabled={escalatingId === alert.id}
                          >
                            <ArrowUpCircle className="h-3 w-3" />
                            {escalatingId === alert.id ? 'Escalating...' : 'Escalate'}
                          </Button>
                        )}
                      {alert.incident_id && (
                        <div className="w-full">
                          <p className="text-xs text-primary mt-1">
                            <span className="font-medium">✓ Linked to incident</span>
                          </p>
                        </div>
                      )}
                      {alert.resolution_method && alert.status === 'resolved' && (
                        <div className="w-full">
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            <span className="font-medium">Resolution:</span> {alert.resolution_method}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                  <Filter className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium">No alerts found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alerts.length === 0
                      ? 'Simulation is generating alerts automatically...'
                      : 'Try adjusting your filters or search term'}
                  </p>
                  {alerts.length === 0 && (
                    <div className="flex items-center gap-2 mt-4 text-primary">
                      <Play className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">Generating alerts...</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Alerts;
