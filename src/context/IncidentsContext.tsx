import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/NotificationsContext';
import { useActivity } from '@/context/ActivityContext';
import { useAuth } from '@/context/AuthContext';
import { logAuditAction } from '@/hooks/useAuditLog';
import type { Json } from '@/integrations/supabase/types';
import { getNextCaseNumber } from '@/utils/incidentUtils';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: IncidentStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  alert_count: number;
  evidence_count: number;
}

interface IncidentsContextType {
  incidents: Incident[];
  loading: boolean;
  addIncident: (data: {
    title: string;
    description: string;
    severity: Severity;
    tags: string[];
  }) => Promise<void>;
  updateIncident: (id: string, data: Partial<Incident>) => Promise<void>;
}

const IncidentsContext = createContext<IncidentsContextType | undefined>(undefined);

export function IncidentsProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { addActivity } = useActivity();
  const { user, profile } = useAuth();

  // Get current user's display name
  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email;
    return 'System';
  };

  // Fetch incidents on mount
  useEffect(() => {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50000);

      if (error) {
        console.error('Error fetching incidents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load incidents',
          variant: 'destructive',
        });
      } else {
        setIncidents(data || []);
      }
      setLoading(false);
    };

    fetchIncidents();

    // Set up real-time subscription
    const channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
        },
        (payload) => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            const newIncident = payload.new as Incident;
            setIncidents(prev => {
              if (prev.some(i => i.id === newIncident.id)) return prev;
              return [newIncident, ...prev];
            });

            // Add notification for new incident
            const notificationType = newIncident.severity === 'critical' ? 'critical'
              : newIncident.severity === 'high' ? 'warning'
                : 'info';

            addNotification({
              type: notificationType,
              title: `New Incident: ${newIncident.case_number}`,
              message: newIncident.title,
              incidentId: newIncident.id,
              caseNumber: newIncident.case_number,
            });

            // Add activity for new incident
            addActivity({
              incidentId: newIncident.id,
              type: 'alert',
              title: `New incident created: ${newIncident.case_number}`,
              description: newIncident.title,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedIncident = payload.new as Incident;
            const oldIncident = payload.old as Partial<Incident>;

            setIncidents(prev =>
              prev.map(inc =>
                inc.id === updatedIncident.id ? updatedIncident : inc
              )
            );

            // Check for status change
            if (oldIncident.status !== updatedIncident.status) {
              addNotification({
                type: 'info',
                title: `${updatedIncident.case_number} Status Updated`,
                message: `Status changed to ${updatedIncident.status}`,
                incidentId: updatedIncident.id,
                caseNumber: updatedIncident.case_number,
              });

              addActivity({
                incidentId: updatedIncident.id,
                type: 'status_change',
                title: `Status changed to ${updatedIncident.status}`,
                description: `${updatedIncident.case_number}: ${updatedIncident.title}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setIncidents(prev =>
              prev.filter(inc => inc.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, addNotification, addActivity]);

  const addIncident = async (data: {
    title: string;
    description: string;
    severity: Severity;
    tags: string[];
  }) => {
    const nextCaseNumber = await getNextCaseNumber();

    const { data: insertedData, error } = await supabase.from('incidents').insert([{
      case_number: nextCaseNumber,
      title: data.title,
      description: data.description || null,
      severity: data.severity,
      tags: data.tags,
      status: 'open' as const,
    }]).select().single();

    if (error) {
      console.error('Error creating incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to create incident',
        variant: 'destructive',
      });
      throw error;
    }

    // Log audit action with current user's name
    if (insertedData) {
      setIncidents(prev => [insertedData as Incident, ...prev]);

      await logAuditAction(user?.id || null, user?.email || 'unknown', {
        action: 'incident_created',
        entityType: 'incident',
        entityId: insertedData.id,
        entityName: insertedData.case_number,
        details: {
          title: data.title,
          severity: data.severity,
          createdBy: getUserDisplayName(),
        } as unknown as Record<string, Json>,
      });
    }
  };

  const updateIncident = async (id: string, data: Partial<Incident>) => {
    const incident = incidents.find(i => i.id === id);
    const previousStatus = incident?.status;

    const { error } = await supabase
      .from('incidents')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to update incident',
        variant: 'destructive',
      });
      throw error;
    }

    // Optimistically update local state
    setIncidents(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...data } : item
      )
    );

    // Determine audit action type
    let action: 'incident_updated' | 'incident_status_changed' | 'incident_resolved' | 'incident_closed' = 'incident_updated';
    if (data.status && data.status !== previousStatus) {
      if (data.status === 'resolved') {
        action = 'incident_resolved';
      } else if (data.status === 'closed') {
        action = 'incident_closed';
      } else {
        action = 'incident_status_changed';
      }
    }

    // Log audit action with current user's name
    await logAuditAction(user?.id || null, user?.email || 'unknown', {
      action,
      entityType: 'incident',
      entityId: id,
      entityName: incident?.case_number || id,
      details: {
        changes: data,
        previousStatus: previousStatus,
        newStatus: data.status,
        updatedBy: getUserDisplayName(),
      } as unknown as Record<string, Json>,
    });
  };

  return (
    <IncidentsContext.Provider value={{ incidents, loading, addIncident, updateIncident }}>
      {children}
    </IncidentsContext.Provider>
  );
}

export function useIncidents() {
  const context = useContext(IncidentsContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentsProvider');
  }
  return context;
}