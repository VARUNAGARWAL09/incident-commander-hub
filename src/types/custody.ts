/**
 * Evidence Integrity Types
 * 
 * Defines types for evidence chain of custody and integrity verification.
 * Extends evidence metadata without modifying core schema.
 */

export interface EvidenceCustodyMetadata {
    sha256: string;
    created_by: string;
    created_at: string;
    last_accessed: string;
    integrity_verified: boolean;
    verification_timestamp?: string;
    audit_trail: AuditEntry[];
}

export interface AuditEntry {
    action: 'created' | 'accessed' | 'verified' | 'modified';
    user_id: string;
    timestamp: string;
    details?: string;
}

export interface IntegrityVerificationResult {
    isValid: boolean;
    currentHash: string;
    storedHash: string;
    verifiedAt: string;
    message: string;
}
