import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SLAConfig {
  id: string;
  name: string;
  severity: string;
  acknowledge_within_minutes: number;
  resolve_within_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SLAStatus {
  status: 'on_track' | 'at_risk' | 'breached';
  acknowledgeDeadline: Date | null;
  resolveDeadline: Date | null;
  timeToAcknowledge: number | null; // minutes remaining or negative if breached
  timeToResolve: number | null;
  isAcknowledged: boolean;
  isResolved: boolean;
}

export function useSLA() {
  const [slaConfigs, setSlaConfigs] = useState<SLAConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSLAConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sla_configs')
        .select('*')
        .eq('is_active', true)
        .order('severity');

      if (error) throw error;
      setSlaConfigs((data as SLAConfig[]) || []);
    } catch (e) {
      console.error('Failed to fetch SLA configs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSLAConfigs();
  }, [fetchSLAConfigs]);

  const getSLAForSeverity = useCallback(
    (severity: string): SLAConfig | undefined => {
      return slaConfigs.find((c) => c.severity === severity);
    },
    [slaConfigs]
  );

  const calculateSLAStatus = useCallback(
    (
      severity: string,
      createdAt: string,
      acknowledgedAt: string | null,
      closedAt: string | null
    ): SLAStatus => {
      const config = getSLAForSeverity(severity);
      const now = new Date();
      const created = new Date(createdAt);

      if (!config) {
        return {
          status: 'on_track',
          acknowledgeDeadline: null,
          resolveDeadline: null,
          timeToAcknowledge: null,
          timeToResolve: null,
          isAcknowledged: !!acknowledgedAt,
          isResolved: !!closedAt,
        };
      }

      const acknowledgeDeadline = new Date(
        created.getTime() + config.acknowledge_within_minutes * 60 * 1000
      );
      const resolveDeadline = new Date(
        created.getTime() + config.resolve_within_minutes * 60 * 1000
      );

      const isAcknowledged = !!acknowledgedAt;
      const isResolved = !!closedAt;

      let timeToAcknowledge: number | null = null;
      let timeToResolve: number | null = null;

      if (!isAcknowledged) {
        timeToAcknowledge = Math.floor(
          (acknowledgeDeadline.getTime() - now.getTime()) / 60000
        );
      }

      if (!isResolved) {
        timeToResolve = Math.floor(
          (resolveDeadline.getTime() - now.getTime()) / 60000
        );
      }

      let status: 'on_track' | 'at_risk' | 'breached' = 'on_track';

      // Check for breach
      if (
        (!isAcknowledged && timeToAcknowledge !== null && timeToAcknowledge < 0) ||
        (!isResolved && timeToResolve !== null && timeToResolve < 0)
      ) {
        status = 'breached';
      }
      // Check for at risk (within 25% of deadline)
      else if (
        (!isAcknowledged &&
          timeToAcknowledge !== null &&
          timeToAcknowledge < config.acknowledge_within_minutes * 0.25) ||
        (!isResolved &&
          timeToResolve !== null &&
          timeToResolve < config.resolve_within_minutes * 0.25)
      ) {
        status = 'at_risk';
      }

      return {
        status,
        acknowledgeDeadline,
        resolveDeadline,
        timeToAcknowledge,
        timeToResolve,
        isAcknowledged,
        isResolved,
      };
    },
    [getSLAForSeverity]
  );

  const updateSLAConfig = async (
    id: string,
    updates: Partial<SLAConfig>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sla_configs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchSLAConfigs();
      return true;
    } catch (e) {
      console.error('Failed to update SLA config:', e);
      return false;
    }
  };

  return {
    slaConfigs,
    loading,
    getSLAForSeverity,
    calculateSLAStatus,
    updateSLAConfig,
    refetch: fetchSLAConfigs,
  };
}

export function formatTimeRemaining(minutes: number | null): string {
  if (minutes === null) return '-';
  
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes);
    if (absMinutes >= 1440) {
      return `${Math.floor(absMinutes / 1440)}d overdue`;
    }
    if (absMinutes >= 60) {
      return `${Math.floor(absMinutes / 60)}h overdue`;
    }
    return `${absMinutes}m overdue`;
  }

  if (minutes >= 1440) {
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  }
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
