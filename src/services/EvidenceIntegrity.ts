/**
 * Evidence Integrity Service
 * 
 * Provides SHA-256 hashing and integrity verification for evidence.
 * Non-intrusive - only extends evidence metadata via JSONB fields.
 */

import { supabase } from '@/integrations/supabase/client';
import type { EvidenceCustodyMetadata, IntegrityVerificationResult, AuditEntry } from '@/types/custody';

/**
 * Generates SHA-256 hash for a given value
 * @param value - The evidence value to hash
 * @returns SHA-256 hash as hex string
 */
export async function generateSHA256(value: string): Promise<string> {
    // Use Web Crypto API for SHA-256 hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Creates custody metadata for new evidence
 * @param evidenceValue - The evidence value
 * @param userId - Current user ID
 * @returns Custody metadata object
 */
export async function createCustodyMetadata(
    evidenceValue: string,
    userId: string
): Promise<EvidenceCustodyMetadata> {
    const sha256 = await generateSHA256(evidenceValue);
    const timestamp = new Date().toISOString();

    return {
        sha256,
        created_by: userId,
        created_at: timestamp,
        last_accessed: timestamp,
        integrity_verified: true,
        verification_timestamp: timestamp,
        audit_trail: [
            {
                action: 'created',
                user_id: userId,
                timestamp,
                details: 'Evidence created with integrity hash'
            }
        ]
    };
}

/**
 * Verifies evidence integrity by comparing hashes
 * @param evidenceId - Evidence ID
 * @param evidenceValue - Current evidence value
 * @returns Verification result
 */
export async function verifyEvidenceIntegrity(
    evidenceId: string,
    evidenceValue: string
): Promise<IntegrityVerificationResult> {
    try {
        // Fetch evidence metadata from database
        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('metadata')
            .eq('id', evidenceId)
            .single();

        if (error || !evidence) {
            return {
                isValid: false,
                currentHash: '',
                storedHash: '',
                verifiedAt: new Date().toISOString(),
                message: 'Evidence not found or error retrieving metadata'
            };
        }

        // Extract custody metadata
        const metadata = evidence.metadata as any;
        const custody: Partial<EvidenceCustodyMetadata> = metadata?.custody || {};

        if (!custody.sha256) {
            return {
                isValid: false,
                currentHash: '',
                storedHash: '',
                verifiedAt: new Date().toISOString(),
                message: 'No integrity hash found - evidence predates custody tracking'
            };
        }

        // Calculate current hash
        const currentHash = await generateSHA256(evidenceValue);
        const isValid = currentHash === custody.sha256;

        // Update last_accessed timestamp
        const updatedCustody = {
            ...custody,
            last_accessed: new Date().toISOString(),
            integrity_verified: isValid,
            verification_timestamp: new Date().toISOString(),
            audit_trail: [
                ...(custody.audit_trail || []),
                {
                    action: 'verified' as const,
                    user_id: 'current_user', // TODO: Get from auth context
                    timestamp: new Date().toISOString(),
                    details: isValid ? 'Integrity verified successfully' : 'Integrity check FAILED - hash mismatch'
                }
            ]
        };

        // Update metadata in database (non-blocking)
        supabase
            .from('evidence')
            .update({
                metadata: {
                    ...metadata,
                    custody: updatedCustody
                }
            })
            .eq('id', evidenceId)
            .then(() => console.log('✅ Evidence custody metadata updated'));

        return {
            isValid,
            currentHash,
            storedHash: custody.sha256,
            verifiedAt: new Date().toISOString(),
            message: isValid
                ? 'Evidence integrity verified successfully'
                : '⚠️ WARNING: Evidence has been modified - hash mismatch detected!'
        };
    } catch (error) {
        console.error('❌ Error verifying evidence integrity:', error);
        return {
            isValid: false,
            currentHash: '',
            storedHash: '',
            verifiedAt: new Date().toISOString(),
            message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Retrieves audit trail for evidence
 * @param evidenceId - Evidence ID
 * @returns Array of audit entries
 */
export async function getEvidenceAuditTrail(evidenceId: string): Promise<AuditEntry[]> {
    try {
        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('metadata')
            .eq('id', evidenceId)
            .single();

        if (error || !evidence) {
            return [];
        }

        const metadata = evidence.metadata as any;
        const custody: Partial<EvidenceCustodyMetadata> = metadata?.custody || {};

        return custody.audit_trail || [];
    } catch (error) {
        console.error('❌ Error retrieving audit trail:', error);
        return [];
    }
}

/**
 * Adds custody metadata to existing evidence (migration helper)
 * @param evidenceId - Evidence ID
 * @param evidenceValue - Evidence value
 * @param userId - User ID
 */
export async function addCustodyToExistingEvidence(
    evidenceId: string,
    evidenceValue: string,
    userId: string
): Promise<boolean> {
    try {
        const custodyData = await createCustodyMetadata(evidenceValue, userId);

        const { error } = await supabase
            .from('evidence')
            .update({
                metadata: {
                    custody: custodyData
                }
            })
            .eq('id', evidenceId);

        if (error) {
            console.error('❌ Error adding custody metadata:', error);
            return false;
        }

        console.log('✅ Custody metadata added to evidence:', evidenceId);
        return true;
    } catch (error) {
        console.error('❌ Error in addCustodyToExistingEvidence:', error);
        return false;
    }
}
