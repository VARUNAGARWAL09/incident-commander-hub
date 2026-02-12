/**
 * Risk Scoring Service
 * 
 * Post-insertion risk score adjustment based on pattern detection.
 * Non-intrusive - operates after alerts are created, doesn't modify creation logic.
 */

import { supabase } from '@/integrations/supabase/client';

export interface RiskAdjustment {
    reason: string;
    adjustment: number;
    pattern: string;
}

export interface RiskScoringResult {
    originalScore: number;
    adjustedScore: number;
    adjustments: RiskAdjustment[];
    shouldEscalate: boolean;
    newSeverity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

/**
 * Analyzes alert and calculates risk score adjustments
 * @param alertId - The alert to analyze
 * @returns Risk scoring result with adjustments
 */
export async function calculateRiskScore(alertId: string): Promise<RiskScoringResult | null> {
    try {
        // Fetch the alert
        const { data: alert, error: alertError } = await supabase
            .from('alerts')
            .select('*')
            .eq('id', alertId)
            .single();

        if (alertError || !alert) {
            console.error('❌ Error fetching alert for risk scoring:', alertError);
            return null;
        }

        const rawData = alert.raw_data || {};
        const adjustments: RiskAdjustment[] = [];
        let totalAdjustment = 0;
        const baseScore = (rawData as any).risk_score || getBaseSeverityScore(alert.severity);

        // Rule 1: IP Reputation - Same IP triggering multiple alerts
        await checkIPReputation(alert, adjustments);

        // Rule 2: Attack Combinations
        await checkAttackCombinations(alert, adjustments);

        // Rule 3: Data Exfiltration Threshold
        checkDataExfiltration(alert, adjustments);

        // Rule 4: Time-based Escalation
        await checkTimeBasedEscalation(alert, adjustments);

        // Calculate total adjustment
        totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
        const adjustedScore = Math.min(100, Math.max(0, baseScore + totalAdjustment));

        // Determine if escalation needed
        const shouldEscalate = adjustedScore >= 70 && baseScore < 70;
        const newSeverity = shouldEscalate ? getSeverityFromScore(adjustedScore) : undefined;

        // Update alert metadata with risk adjustment (non-blocking)
        if (adjustments.length > 0) {
            updateAlertRiskMetadata(alertId, {
                original_score: baseScore,
                adjusted_score: adjustedScore,
                adjustments,
                escalated: shouldEscalate,
                timestamp: new Date().toISOString()
            });
        }

        return {
            originalScore: baseScore,
            adjustedScore,
            adjustments,
            shouldEscalate,
            newSeverity
        };
    } catch (error) {
        console.error('❌ Error in calculateRiskScore:', error);
        return null;
    }
}

// Helper functions

async function checkIPReputation(alert: any, adjustments: RiskAdjustment[]) {
    const rawData = alert.raw_data || {};
    const sourceIP = rawData.source_ip || rawData.ip;

    if (!sourceIP) return;

    // Check for other alerts from same IP in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: relatedAlerts, error } = await supabase
        .from('alerts')
        .select('id')
        .neq('id', alert.id)
        .gte('created_at', oneHourAgo);

    if (error) return;

    const sameIPCount = relatedAlerts?.filter(a => {
        const aData = (a as any).raw_data || {};
        return aData.source_ip === sourceIP || aData.ip === sourceIP;
    }).length || 0;

    if (sameIPCount >= 2) {
        adjustments.push({
            reason: `Multiple alerts (${sameIPCount + 1}) from same IP (${sourceIP}) in last hour`,
            adjustment: +20,
            pattern: 'ip_reputation'
        });
    }
}

async function checkAttackCombinations(alert: any, adjustments: RiskAdjustment[]) {
    const title = alert.title.toLowerCase();
    const source = alert.source.toLowerCase();

    // Check for brute force + SQL injection combination
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentAlerts } = await supabase
        .from('alerts')
        .select('title')
        .gte('created_at', oneHourAgo)
        .limit(50);

    if (!recentAlerts) return;

    const hasBruteForce = title.includes('brute') || recentAlerts.some(a =>
        a.title.toLowerCase().includes('brute')
    );
    const hasSQLInjection = title.includes('sql') || title.includes('injection') ||
        recentAlerts.some(a => a.title.toLowerCase().includes('sql') || a.title.toLowerCase().includes('injection'));

    if (hasBruteForce && hasSQLInjection) {
        adjustments.push({
            reason: 'Multi-stage attack detected: Brute force + SQL injection combination',
            adjustment: +25,
            pattern: 'attack_combination'
        });
    }
}

function checkDataExfiltration(alert: any, adjustments: RiskAdjustment[]) {
    const title = alert.title.toLowerCase();
    const rawData = alert.raw_data || {};

    if (title.includes('exfiltration') || title.includes('data transfer')) {
        const transferSize = rawData.transfer_size_mb || 0;

        if (transferSize > 100) {
            adjustments.push({
                reason: `Large data transfer detected: ${transferSize}MB exceeds threshold`,
                adjustment: +30,
                pattern: 'data_exfiltration'
            });
        }
    }
}

async function checkTimeBasedEscalation(alert: any, adjustments: RiskAdjustment[]) {
    const source = alert.source;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentFromSource } = await supabase
        .from('alerts')
        .select('id')
        .eq('source', source)
        .neq('id', alert.id)
        .gte('created_at', oneHourAgo);

    if (recentFromSource && recentFromSource.length >= 3) {
        adjustments.push({
            reason: `Repeated alerts from ${source}: ${recentFromSource.length + 1} alerts in last hour`,
            adjustment: +15,
            pattern: 'time_based_escalation'
        });
    }
}

function getBaseSeverityScore(severity: string): number {
    const scores: Record<string, number> = {
        critical: 90,
        high: 70,
        medium: 50,
        low: 30,
        info: 10
    };
    return scores[severity] || 50;
}

function getSeverityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (score >= 85) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'info';
}

async function updateAlertRiskMetadata(alertId: string, riskData: any) {
    try {
        const { data: existing } = await supabase
            .from('alerts')
            .select('raw_data')
            .eq('id', alertId)
            .single();

        const currentRawData = existing?.raw_data || {};

        await supabase
            .from('alerts')
            .update({
                raw_data: {
                    ...currentRawData,
                    risk_adjustment: riskData
                }
            })
            .eq('id', alertId);

        console.log('✅ Risk adjustment metadata updated for alert:', alertId);
    } catch (error) {
        console.error('❌ Error updating risk metadata:', error);
    }
}
