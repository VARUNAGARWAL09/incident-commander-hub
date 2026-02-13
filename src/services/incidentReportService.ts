
import { supabase } from '@/integrations/supabase/client';
import { IncidentReport, CreateReportDTO } from '@/types/incidentReport';

export const reportService = {
    async getReport(incidentId: string): Promise<IncidentReport | null> {
        try {
            const { data, error } = await supabase
                .from('incident_reports' as any)
                .select('*')
                .eq('incident_id', incidentId)
                .maybeSingle();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                if (error.message.includes('relation "public.incident_reports" does not exist')) {
                    console.warn('Report table missing. Please run migration.');
                    return null;
                }
                throw error;
            }
            return data as unknown as IncidentReport;
        } catch (e) {
            console.error('Error fetching report:', e);
            return null;
        }
    },

    async createOrUpdateReport(incidentId: string, data: Partial<CreateReportDTO> & { created_by?: string }): Promise<IncidentReport | null> {
        try {
            // Check if report exists
            const existing = await this.getReport(incidentId);

            if (existing) {
                // Update
                const { data: updated, error } = await supabase
                    .from('incident_reports' as any)
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('incident_id', incidentId)
                    .select()
                    .single();

                if (error) throw error;
                return updated as unknown as IncidentReport;
            } else {
                // Create
                const { data: created, error } = await supabase
                    .from('incident_reports' as any)
                    .insert({
                        incident_id: incidentId,
                        ...data,
                        status: 'draft',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (error) throw error;
                return created as unknown as IncidentReport;
            }
        } catch (e) {
            console.error('Error saving report:', e);
            return null;
        }
    },

    async approveReport(reportId: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('incident_reports' as any)
            .update({
                status: 'approved',
                approved_by: userId,
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId);

        return !error;
    }
};
