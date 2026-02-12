import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type AuditAction = 
  | 'incident_created'
  | 'incident_updated'
  | 'incident_status_changed'
  | 'incident_acknowledged'
  | 'incident_resolved'
  | 'incident_closed'
  | 'alert_created'
  | 'alert_acknowledged'
  | 'alert_resolved'
  | 'alert_dismissed'
  | 'evidence_added'
  | 'evidence_updated'
  | 'evidence_deleted'
  | 'user_login'
  | 'user_logout'
  | 'settings_changed'
  | 'report_generated'
  | 'sla_config_updated';

type EntityType = 'incident' | 'alert' | 'evidence' | 'user' | 'settings' | 'report' | 'sla_config';

interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async ({
    action,
    entityType,
    entityId,
    entityName,
    details,
  }: AuditLogParams) => {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'system',
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        entity_name: entityName || null,
        details: details || null,
      });

      if (error) {
        console.error('Failed to log audit action:', error);
      }
    } catch (e) {
      console.error('Audit log error:', e);
    }
  };

  return { logAction };
}

// Standalone function for use outside React components
export async function logAuditAction(
  userId: string | null,
  userEmail: string,
  params: AuditLogParams
) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      details: params.details || null,
    });

    if (error) {
      console.error('Failed to log audit action:', error);
    }
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
