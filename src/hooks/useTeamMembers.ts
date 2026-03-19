import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  team_id: string | null;
  avatar_url: string | null;
  member_since: string;
  is_online: boolean;
  last_active?: Date;
}

// Persist current user's last-active time in localStorage so it survives account switches
const LAST_ACTIVE_KEY = 'team_last_active';

function saveLastActive(userId: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(LAST_ACTIVE_KEY) || '{}');
    stored[userId] = new Date().toISOString();
    localStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify(stored));
  } catch {
    // ignore storage errors
  }
}

function getLastActive(userId: string): Date | undefined {
  try {
    const stored = JSON.parse(localStorage.getItem(LAST_ACTIVE_KEY) || '{}');
    if (stored[userId]) return new Date(stored[userId]);
  } catch {
    // ignore
  }
  return undefined;
}

export function useTeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Record current user as active right now
  useEffect(() => {
    if (user?.id) {
      saveLastActive(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMembers();

    // Keep current user's last-active refreshed every 30 seconds
    const heartbeat = setInterval(() => {
      if (user?.id) saveLastActive(user.id);
    }, 30000);

    // Set up realtime subscription for profile changes
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeat);
    };
  }, [user]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('member_since', { ascending: true });

      if (error) throw error;

      const membersWithStatus: TeamMember[] = (data || []).map((profile) => {
        const isCurrentUser = user?.id === profile.id;

        // For the current logged-in user: they're online right now
        // For everyone else: read their last-seen from localStorage (persisted across account switches)
        let lastActive: Date | undefined;
        if (isCurrentUser) {
          lastActive = new Date();
          saveLastActive(profile.id);
        } else {
          lastActive = getLastActive(profile.id);
        }

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          team_id: profile.team_id,
          avatar_url: profile.avatar_url,
          member_since: profile.member_since,
          is_online: isCurrentUser,
          last_active: lastActive,
        };
      });

      // Inject Prithviraj as a permanent team member if not already present
      const alreadyPresent = membersWithStatus.some(
        (m) =>
          m.email === 'prithvirajdeshmukh.cy22' ||
          m.full_name === 'Prithviraj Jaysingrao Deshmukh'
      );

      if (!alreadyPresent) {
        const prithviraj: TeamMember = {
          id: 'mock-prithviraj-2024',
          email: 'prithvirajdeshmukh.cy22',
          full_name: 'Prithviraj Jaysingrao Deshmukh',
          role: 'analyst',
          team_id: 'team-1',
          avatar_url: null,
          member_since: '2024-02-08T00:00:00.000Z',
          is_online: false,
          last_active: getLastActive('mock-prithviraj-2024') ?? new Date(Date.now() - 900000),
        };

        // Insert in chronological order by member_since date
        const insertIndex = membersWithStatus.findIndex(
          (m) => new Date(m.member_since) > new Date(prithviraj.member_since)
        );

        if (insertIndex === -1) {
          membersWithStatus.push(prithviraj);
        } else {
          membersWithStatus.splice(insertIndex, 0, prithviraj);
        }
      }

      setMembers(membersWithStatus);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, refetch: fetchMembers };
}
