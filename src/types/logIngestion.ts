/**
 * Type definitions for Log Ingestion Module
 * 
 * This module is completely isolated from the existing simulation system.
 * It provides types for log parsing, detection rules, and alert generation.
 */

export type LogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface LogEntry {
    timestamp: string;
    rawLine: string;
    lineNumber: number;
}

export interface DetectionRule {
    id: string;
    name: string;
    description: string;
    pattern: RegExp;
    severity: LogSeverity;
    riskScore: number;
    category: string;
    mitreAttack?: string[];
    recommendedActions: string[];
}

export interface LogDetection {
    rule: DetectionRule;
    matches: LogMatch[];
    severity: LogSeverity;
    riskScore: number;
    aggregatedMetadata: Record<string, any>;
}

export interface LogMatch {
    lineNumber: number;
    rawLine: string;
    timestamp: string;
    extractedData: Record<string, any>;
}

export interface ParsedLogResult {
    fileName: string;
    totalLines: number;
    detections: LogDetection[];
    processingTime: number;
}

export interface AlertPayload {
    title: string;
    description: string;
    source: string;
    severity: LogSeverity;
    status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
    raw_data: Record<string, any>;
    resolution_method: string;
}

export interface ProcessingSummary {
    totalLines: number;
    alertsGenerated: number;
    skippedDuplicates: number;
    criticalAlerts: number;
    highAlerts: number;
    mediumAlerts: number;
    lowAlerts: number;
    processingTime: number;
}
