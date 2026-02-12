import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Plus,
  Filter,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { IncidentRow } from '@/components/dashboard/IncidentRow';
import { NewIncidentDialog } from '@/components/dashboard/NewIncidentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncidents, type Severity, type IncidentStatus } from '@/context/IncidentsContext';

const Incidents = () => {
  const { incidents, loading } = useIncidents();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredIncidents = incidents
    .filter(incident => {
      const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
            >
              Incident Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Track, investigate, and resolve security incidents
            </motion.p>
          </div>

          <NewIncidentDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Incident
              </Button>
            }
          />
        </div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, case number, or tags..."
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
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as IncidentStatus | 'all')}
          >
            <SelectTrigger className="w-[150px] bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="contained">Contained</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          <div className="flex items-center rounded-lg border bg-secondary/50 p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing <span className="font-semibold text-foreground">{filteredIncidents.length}</span> of{' '}
            <span className="font-semibold text-foreground">{incidents.length}</span> incidents
          </p>
        </div>

        {viewMode === 'list' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border bg-card overflow-hidden"
          >
            {filteredIncidents.length > 0 ? (
              <div className="divide-y divide-border/50">
                {filteredIncidents.map((incident, index) => (
                  <IncidentRow key={incident.id} incident={incident} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Filter className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">No incidents found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search term
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident, index) => (
                <IncidentRow key={incident.id} incident={incident} index={index} viewMode="grid" />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
                <Filter className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">No incidents found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search term
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default Incidents;
