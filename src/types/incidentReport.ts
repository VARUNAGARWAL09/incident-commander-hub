
export interface IncidentReport {
    id: string;
    incident_id: string;
    executive_summary: {
        summary: string;
        timeline_summary: string;
        severity_assessment: string;
    } | null;
    technical_analysis: {
        attack_vector: string;
        mitre_techniques: string[];
        iocs: string[];
        correlated_alerts: string[];
    } | null;
    root_cause: {
        type: string;
        description: string;
        contributing_factors: string[];
    } | null;
    business_impact: {
        affected_systems: string[];
        data_exposed: boolean;
        downtime_duration: string;
        risk_level: string;
    } | null;
    remediation: {
        actions_taken: string[];
        patches_applied: string[];
        isolation_status: string;
    } | null;
    compliance_mapping: {
        nist_detect: boolean;
        nist_respond: boolean;
        nist_recover: boolean;
        iso_controls: string[];
    } | null;
    created_by: string;
    reviewed_by: string | null;
    approved_by: string | null;
    status: 'draft' | 'final' | 'approved';
    created_at: string;
    updated_at: string;
}

export type CreateReportDTO = Omit<IncidentReport, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'reviewed_by' | 'approved_by' | 'status'>;
