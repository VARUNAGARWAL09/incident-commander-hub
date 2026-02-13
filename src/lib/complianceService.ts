/**
 * Compliance Service
 * 
 * Read-only service for calculating compliance metrics
 * Uses existing incident, alert, and audit data
 * All functions are defensive and handle missing data gracefully
 */

import { Incident } from '@/context/IncidentsContext';
import { differenceInMinutes, differenceInHours, parseISO } from 'date-fns';

// ===== INTERFACES =====

export interface NistFunction {
    id: string;
    name: string;
    description: string;
    coverage: number; // 0-100
    mappedFeatures: string[];
}

export interface IsoControl {
    id: string;
    name: string;
    category: string;
    status: 'Implemented' | 'Partial' | 'Not Covered';
    mappedFeature: string;
    description: string;
}

export interface SlaMetrics {
    totalIncidents: number;
    withinSla: number;
    breachedSla: number;
    compliancePercentage: number;
    averageResolutionMinutes: number;
    mttr: string; // Formatted string
}

export interface ResolutionMetrics {
    resolutionRate: number;
    averageResponseMinutes: number;
    averageContainmentMinutes: number;
    averageResolutionMinutes: number;
    totalIncidents: number;
    closedIncidents: number;
    openIncidents: number;
}

export interface TrendDataPoint {
    date: string;
    incidents: number;
    resolved: number;
}

// ===== SLA THRESHOLDS (in minutes) =====
const SLA_THRESHOLDS = {
    critical: 15,
    high: 60,
    medium: 240,
    low: 1440,
};

// ===== NIST CSF MAPPING =====

export const getNistAlignment = (
    hasAlerts: boolean,
    hasIncidents: boolean,
    hasPlaybooks: boolean,
    hasAuditLog: boolean
): NistFunction[] => {
    return [
        {
            id: 'identify',
            name: 'Identify',
            description: 'Asset Management, Risk Assessment, Governance',
            coverage: hasIncidents && hasAuditLog ? 85 : 60,
            mappedFeatures: [
                'Team Management',
                'Role-Based Access Control',
                'Asset Inventory (Evidence)',
                hasAuditLog ? 'Audit Logging' : null,
            ].filter(Boolean) as string[],
        },
        {
            id: 'protect',
            name: 'Protect',
            description: 'Access Control, Data Security, Protective Technology',
            coverage: hasAuditLog ? 75 : 50,
            mappedFeatures: [
                'Access Controls (Supabase RLS)',
                'Authentication',
                hasAuditLog ? 'Activity Tracking' : null,
            ].filter(Boolean) as string[],
        },
        {
            id: 'detect',
            name: 'Detect',
            description: 'Anomalies & Events, Continuous Monitoring',
            coverage: hasAlerts && hasIncidents ? 95 : 70,
            mappedFeatures: [
                hasAlerts ? 'Real-time Alerting' : null,
                'Log Ingestion',
                'Threat Simulation',
                'MITRE ATT&CK Mapping',
            ].filter(Boolean) as string[],
        },
        {
            id: 'respond',
            name: 'Respond',
            description: 'Response Planning, Communications, Analysis, Mitigation',
            coverage: hasIncidents && hasPlaybooks ? 90 : 65,
            mappedFeatures: [
                hasIncidents ? 'Incident Lifecycle Management' : null,
                hasPlaybooks ? 'Response Playbooks' : null,
                'Auto-Escalation',
                'Team Assignment',
            ].filter(Boolean) as string[],
        },
        {
            id: 'recover',
            name: 'Recover',
            description: 'Recovery Planning, Improvements, Communications',
            coverage: hasIncidents ? 80 : 55,
            mappedFeatures: [
                'SLA Tracking',
                hasIncidents ? 'Resolution Workflows' : null,
                'Post-Incident Documentation',
            ].filter(Boolean) as string[],
        },
    ];
};

// ===== ISO 27001 CONTROL MAPPING =====

export const getIsoControls = (
    hasIncidents: boolean,
    hasAuditLog: boolean,
    hasEvidence: boolean
): IsoControl[] => {
    return [
        {
            id: 'A.5',
            name: 'Information Security Policies',
            category: 'Organizational Controls',
            status: hasAuditLog ? 'Implemented' : 'Partial',
            mappedFeature: 'Security Documentation, Audit Logging',
            description: 'Documented policies and procedures for SOC operations',
        },
        {
            id: 'A.8',
            name: 'Asset Management',
            category: 'Organizational Controls',
            status: hasEvidence ? 'Implemented' : 'Partial',
            mappedFeature: 'Evidence Management, Team Inventory',
            description: 'Tracking of information assets and evidence artifacts',
        },
        {
            id: 'A.9',
            name: 'Access Control',
            category: 'Technological Controls',
            status: 'Implemented',
            mappedFeature: 'Role-Based Access Control (RBAC)',
            description: 'User authentication and authorization via Supabase',
        },
        {
            id: 'A.12',
            name: 'Operations Security',
            category: 'Technological Controls',
            status: hasAuditLog ? 'Implemented' : 'Partial',
            mappedFeature: 'Audit Logs, Activity Monitoring',
            description: 'Logging and monitoring of security operations',
        },
        {
            id: 'A.16',
            name: 'Incident Management',
            category: 'Organizational Controls',
            status: hasIncidents ? 'Implemented' : 'Not Covered',
            mappedFeature: 'Incident Lifecycle, Evidence Handling',
            description: 'Comprehensive incident response and management',
        },
        {
            id: 'A.17',
            name: 'Business Continuity',
            category: 'Organizational Controls',
            status: 'Partial',
            mappedFeature: 'SLA Tracking, Resolution Workflows',
            description: 'Service level agreements and recovery procedures',
        },
        {
            id: 'A.18',
            name: 'Compliance',
            category: 'Organizational Controls',
            status: hasAuditLog ? 'Implemented' : 'Partial',
            mappedFeature: 'Audit Trail, Compliance Reporting',
            description: 'Compliance monitoring and reporting capabilities',
        },
    ];
};

// ===== SLA COMPLIANCE METRICS =====

export const calculateSlaMetrics = (incidents: Incident[]): SlaMetrics => {
    if (!incidents || incidents.length === 0) {
        return {
            totalIncidents: 0,
            withinSla: 0,
            breachedSla: 0,
            compliancePercentage: 0,
            averageResolutionMinutes: 0,
            mttr: '0h 0m',
        };
    }

    const closedIncidents = incidents.filter(
        (inc) => inc.status === 'closed' || inc.status === 'resolved'
    );

    let withinSla = 0;
    let breachedSla = 0;
    let totalResolutionMinutes = 0;
    let resolvedCount = 0;

    closedIncidents.forEach((incident) => {
        try {
            const createdAt = parseISO(incident.created_at);
            const resolvedAt = incident.closed_at
                ? parseISO(incident.closed_at)
                : incident.updated_at
                    ? parseISO(incident.updated_at)
                    : null;

            if (!resolvedAt) return;

            const resolutionMinutes = differenceInMinutes(resolvedAt, createdAt);
            totalResolutionMinutes += resolutionMinutes;
            resolvedCount++;

            const slaThreshold = SLA_THRESHOLDS[incident.severity] || SLA_THRESHOLDS.medium;

            if (resolutionMinutes <= slaThreshold) {
                withinSla++;
            } else {
                breachedSla++;
            }
        } catch (error) {
            console.warn('Error calculating SLA for incident:', incident.case_number, error);
        }
    });

    const averageResolutionMinutes = resolvedCount > 0 ? totalResolutionMinutes / resolvedCount : 0;
    const hours = Math.floor(averageResolutionMinutes / 60);
    const minutes = Math.round(averageResolutionMinutes % 60);

    return {
        totalIncidents: incidents.length,
        withinSla,
        breachedSla,
        compliancePercentage:
            closedIncidents.length > 0 ? Math.round((withinSla / closedIncidents.length) * 100) : 0,
        averageResolutionMinutes,
        mttr: `${hours}h ${minutes}m`,
    };
};

// ===== RESOLUTION METRICS =====

export const calculateResolutionMetrics = (incidents: Incident[]): ResolutionMetrics => {
    if (!incidents || incidents.length === 0) {
        return {
            resolutionRate: 0,
            averageResponseMinutes: 0,
            averageContainmentMinutes: 0,
            averageResolutionMinutes: 0,
            totalIncidents: 0,
            closedIncidents: 0,
            openIncidents: 0,
        };
    }

    const closedIncidents = incidents.filter(
        (inc) => inc.status === 'closed' || inc.status === 'resolved'
    );
    const openIncidents = incidents.filter(
        (inc) => inc.status !== 'closed' && inc.status !== 'resolved'
    );

    let totalResponseMinutes = 0;
    let totalContainmentMinutes = 0;
    let totalResolutionMinutes = 0;
    let responseCount = 0;
    let containmentCount = 0;
    let resolutionCount = 0;

    incidents.forEach((incident) => {
        try {
            const createdAt = parseISO(incident.created_at);

            // Response time (created → investigating)
            if (incident.updated_at) {
                const updatedAt = parseISO(incident.updated_at);
                totalResponseMinutes += differenceInMinutes(updatedAt, createdAt);
                responseCount++;
            }

            // Containment time (created → contained/resolved)
            if (incident.status === 'contained' || incident.status === 'resolved' || incident.status === 'closed') {
                const resolvedAt = incident.closed_at
                    ? parseISO(incident.closed_at)
                    : incident.updated_at
                        ? parseISO(incident.updated_at)
                        : null;
                if (resolvedAt) {
                    totalContainmentMinutes += differenceInMinutes(resolvedAt, createdAt);
                    containmentCount++;
                }
            }

            // Resolution time (created → closed)
            if (incident.closed_at) {
                const closedAt = parseISO(incident.closed_at);
                totalResolutionMinutes += differenceInMinutes(closedAt, createdAt);
                resolutionCount++;
            }
        } catch (error) {
            console.warn('Error calculating metrics for incident:', incident.case_number, error);
        }
    });

    return {
        resolutionRate:
            incidents.length > 0 ? Math.round((closedIncidents.length / incidents.length) * 100) : 0,
        averageResponseMinutes: responseCount > 0 ? totalResponseMinutes / responseCount : 0,
        averageContainmentMinutes: containmentCount > 0 ? totalContainmentMinutes / containmentCount : 0,
        averageResolutionMinutes: resolutionCount > 0 ? totalResolutionMinutes / resolutionCount : 0,
        totalIncidents: incidents.length,
        closedIncidents: closedIncidents.length,
        openIncidents: openIncidents.length,
    };
};

// ===== TREND DATA =====

export const calculateTrendData = (incidents: Incident[], days: number = 7): TrendDataPoint[] => {
    if (!incidents || incidents.length === 0) {
        return [];
    }

    const today = new Date();
    const trendData: TrendDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dateStr = date.toISOString().split('T')[0];

        const incidentsOnDay = incidents.filter((inc) => {
            try {
                const createdAt = parseISO(inc.created_at);
                return createdAt >= date && createdAt < nextDate;
            } catch {
                return false;
            }
        });

        const resolvedOnDay = incidentsOnDay.filter(
            (inc) => inc.status === 'closed' || inc.status === 'resolved'
        );

        trendData.push({
            date: dateStr,
            incidents: incidentsOnDay.length,
            resolved: resolvedOnDay.length,
        });
    }

    return trendData;
};

// ===== HELPER: FORMAT MINUTES =====

export const formatMinutes = (minutes: number): string => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
};
