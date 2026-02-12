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

export function useTeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
    
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
    };
  }, [user]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('member_since', { ascending: true });

      if (error) throw error;

      const membersWithStatus: TeamMember[] = (data || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        team_id: profile.team_id,
        avatar_url: profile.avatar_url,
        member_since: profile.member_since,
        is_online: user?.id === profile.id, // Current user is online
        last_active: user?.id === profile.id ? new Date() : undefined,
      }));

      setMembers(membersWithStatus);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, refetch: fetchMembers };
}
