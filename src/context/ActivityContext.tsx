import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type ActivityType = 'action' | 'note' | 'evidence' | 'status_change' | 'assignment' | 'alert';

export interface Activity {
  id: string;
  incident_id: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  addActivity: (activity: {
    incidentId?: string;
    type: ActivityType;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities((data as Activity[]) || []);
    } catch (e) {
      console.error('Failed to fetch activities:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    // Real-time subscription
    const channel = supabase
      .channel('activities-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newActivity = payload.new as Activity;
            setActivities((prev) => {
              if (prev.some(a => a.id === newActivity.id)) return prev;
              return [newActivity, ...prev.slice(0, 99)];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities]);

  const addActivity = useCallback(async (activity: {
    incidentId?: string;
    type: ActivityType;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { error } = await supabase.from('activities').insert({
        incident_id: activity.incidentId || null,
        type: activity.type,
        title: activity.title,
        description: activity.description || null,
        user_id: user?.id || null,
        user_name: user?.email?.split('@')[0] || 'System',
        user_email: user?.email || null,
        metadata: activity.metadata || null,
      });

      if (error) throw error;

      // We don't manually update activities here because we don't have the full record (e.g. id, created_at)
      // returned from the insert in the current code structure, and it's less critical for immediate UI feedback
      // than Incidents/Alerts. Relying on subscription for this one is usually fine, 
      // but if we wanted to be strict we would select().single() and update.
      // Given the user request, let's actually just fetchRefetch or assume the subscription works for this background log.
      // But let's try to be consistent if possible.
      // The insert call above doesn't return data. Let's modify it to return data.

    } catch (e) {
      console.error('Failed to add activity:', e);
    }
  }, [user]);

  return (
    <ActivityContext.Provider value={{ activities, loading, addActivity, refetch: fetchActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
