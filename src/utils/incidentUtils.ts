
import { supabase } from '@/integrations/supabase/client';

export const getNextCaseNumber = async (): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('incidents')
            .select('case_number')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching last case number:', error);
            return `CASE-${Date.now()}`; // Fallback to timestamp if error
        }

        if (!data) {
            return 'CASE-1000'; // Start at 1000 if table is empty
        }

        const lastCase = data.case_number;
        const match = lastCase.match(/CASE-(\d+)/);

        if (match) {
            const nextNum = parseInt(match[1], 10) + 1;
            return `CASE-${nextNum.toString().padStart(3, '0')}`;
        }

        // If format doesn't match, use timestamp
        return `CASE-${Date.now()}`;

    } catch (err) {
        console.error('Error generating case number:', err);
        return `CASE-${Date.now()}`;
    }
};
