/**
 * useEvidenceIntegrity Hook
 * 
 * React hook for managing evidence chain of custody and integrity verification.
 */

import { useState, useCallback } from 'react';
import {
    verifyEvidenceIntegrity,
    getEvidenceAuditTrail,
    createCustodyMetadata
} from '@/services/EvidenceIntegrity';
import type { IntegrityVerificationResult, AuditEntry } from '@/types/custody';
import { useToast } from '@/hooks/use-toast';

export function useEvidenceIntegrity() {
    const { toast } = useToast();
    const [verifying, setVerifying] = useState(false);
    const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);

    const verifyIntegrity = useCallback(async (
        evidenceId: string,
        evidenceValue: string
    ): Promise<IntegrityVerificationResult | null> => {
        setVerifying(true);
        try {
            const result = await verifyEvidenceIntegrity(evidenceId, evidenceValue);

            if (result) {
                toast({
                    title: result.isValid ? '✅ Integrity Verified' : '⚠️ Integrity Check Failed',
                    description: result.message,
                    variant: result.isValid ? 'default' : 'destructive',
                });
            }

            return result;
        } catch (error) {
            toast({
                title: '❌ Verification Error',
                description: 'Failed to verify evidence integrity',
                variant: 'destructive',
            });
            return null;
        } finally {
            setVerifying(false);
        }
    }, [toast]);

    const loadAuditTrail = useCallback(async (evidenceId: string) => {
        const trail = await getEvidenceAuditTrail(evidenceId);
        setAuditTrail(trail);
        return trail;
    }, []);

    return {
        verifyIntegrity,
        loadAuditTrail,
        auditTrail,
        verifying
    };
}
