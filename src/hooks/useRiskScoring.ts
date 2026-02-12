/**
 * useRiskScoring Hook
 * 
 * React hook to automatically analyze and score alerts based on patterns.
 * Can be used to subscribe to new alerts and apply risk scoring.
 */

import { useEffect, useCallback } from 'react';
import { calculateRiskScore } from '@/services/RiskScoringService';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to enable automatic risk scoring for alerts
 * @param enabled - Whether risk scoring is enabled
 * @returns Function to manually trigger risk scoring
 */
export function useRiskScoring(enabled: boolean = true) {
    const { toast } = useToast();

    const scoreAlert = useCallback(async (alertId: string) => {
        if (!enabled) return null;

        try {
            const result = await calculateRiskScore(alertId);

            if (result && result.adjustments.length > 0) {
                console.log('📊 Risk score adjusted for alert:', alertId, result);

                // Show notification if risk was escalated
                if (result.shouldEscalate) {
                    toast({
                        title: '⚠️ Alert Escalated',
                        description: `Risk score increased from ${result.originalScore} to ${result.adjustedScore}. Alert severity elevated to ${result.newSeverity?.toUpperCase()}.`,
                        variant: 'destructive',
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('❌ Error in risk scoring:', error);
            return null;
        }
    }, [enabled, toast]);

    return { scoreAlert };
}
