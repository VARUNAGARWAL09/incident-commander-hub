import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Severity, IncidentStatus } from '@/context/IncidentsContext';

export interface DashboardFilterValues {
  severity: Severity | 'all';
  status: IncidentStatus | 'all';
  timeRange: 'today' | 'week' | 'month' | 'all';
}

interface DashboardFiltersProps {
  filters: DashboardFilterValues;
  onFiltersChange: (filters: DashboardFilterValues) => void;
}

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.severity !== 'all',
    filters.status !== 'all',
    filters.timeRange !== 'all',
  ].filter(Boolean).length;

  const handleReset = () => {
    onFiltersChange({
      severity: 'all',
      status: 'all',
      timeRange: 'all',
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-sm font-semibold">Dashboard Filters</h4>
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto px-2 py-1 text-xs"
                onClick={handleReset}
              >
                <X className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Severity</Label>
              <Select
                value={filters.severity}
                onValueChange={(v) => onFiltersChange({ ...filters, severity: v as Severity | 'all' })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="All severities" />
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
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => onFiltersChange({ ...filters, status: v as IncidentStatus | 'all' })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="All statuses" />
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
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Time Range</Label>
              <Select
                value={filters.timeRange}
                onValueChange={(v) => onFiltersChange({ ...filters, timeRange: v as DashboardFilterValues['timeRange'] })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button size="sm" onClick={() => setOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}