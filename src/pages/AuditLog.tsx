import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileText,
  Search,
  Filter,
  User,
  AlertTriangle,
  Shield,
  Settings,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

const actionColors: Record<string, string> = {
  incident_created: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  incident_updated: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  incident_status_changed: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  incident_acknowledged: 'bg-green-500/10 text-green-500 border-green-500/30',
  incident_resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  incident_closed: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  alert_created: 'bg-red-500/10 text-red-500 border-red-500/30',
  alert_acknowledged: 'bg-green-500/10 text-green-500 border-green-500/30',
  alert_resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  alert_dismissed: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  evidence_added: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
  evidence_updated: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  evidence_deleted: 'bg-red-500/10 text-red-500 border-red-500/30',
  user_login: 'bg-green-500/10 text-green-500 border-green-500/30',
  user_logout: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  settings_changed: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  report_generated: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  sla_config_updated: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
};

const entityIcons: Record<string, React.ReactNode> = {
  incident: <AlertTriangle className="h-4 w-4" />,
  alert: <Shield className="h-4 w-4" />,
  evidence: <FileText className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  report: <Download className="h-4 w-4" />,
  sla_config: <Settings className="h-4 w-4" />,
};

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as AuditLogEntry[]) || []);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          setLogs((prev) => [payload.new as AuditLogEntry, ...prev.slice(0, 199)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity_name?.toLowerCase().includes(search) ||
      log.entity_id?.toLowerCase().includes(search)
    );
  });

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueEntities = [...new Set(logs.map((l) => l.entity_type))];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
            >
              Audit Log
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Track all user actions for compliance and security
            </motion.p>
          </div>

          <Button onClick={fetchLogs} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[150px] bg-secondary/50">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntities.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] bg-secondary/50">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {logs.filter((l) => l.entity_type === 'incident').length}
              </div>
              <p className="text-xs text-muted-foreground">Incident Actions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {logs.filter((l) => l.entity_type === 'alert').length}
              </div>
              <p className="text-xs text-muted-foreground">Alert Actions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {new Set(logs.map((l) => l.user_email)).size}
              </div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">No audit logs found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Actions will appear here as users interact with the system
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[150px]">
                              {log.user_email || 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={actionColors[log.action] || 'bg-gray-500/10'}
                          >
                            {formatAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entityIcons[log.entity_type] || <FileText className="h-4 w-4" />}
                            <div className="flex flex-col">
                              <span className="text-sm capitalize">{log.entity_type}</span>
                              {log.entity_name && (
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {log.entity_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {log.details && (
                            <span className="text-xs text-muted-foreground truncate block">
                              {JSON.stringify(log.details).slice(0, 50)}
                              {JSON.stringify(log.details).length > 50 && '...'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AuditLog;
