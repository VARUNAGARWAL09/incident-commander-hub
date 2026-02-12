/**
 * SourceBadge Component
 * 
 * Visual badge to display the source/origin of an alert.
 * This is a non-intrusive UI enhancement that doesn't modify alert data.
 */

import { Badge } from '@/components/ui/badge';
import { AlertSource, SOURCE_CONFIGS } from '@/types/sourceAttribution';

interface SourceBadgeProps {
    alert: any; // Accept any alert type to avoid conflicts between SimulationContext and incident types
    showIcon?: boolean;
    variant?: 'default' | 'compact';
}

/**
 * Detects the source of an alert based on its metadata
 * @param alert - The alert object (any type to support both SimulationContext and incident types)
 * @returns The detected alert source type
 */
export function detectAlertSource(alert: any): AlertSource {
    // Check source field for known patterns
    const source = alert.source?.toLowerCase() || '';

    // Log ingestion detection
    if (source.includes('log') || source.includes('ingestion') || source.includes('analysis')) {
        return 'log_ingestion';
    }

    // Simulation detection
    if (source.includes('simulation') || source.includes('azure ad') ||
        source.includes('crowdstrike') || source.includes('netskope') ||
        source.includes('proofpoint') || source.includes('firewall') ||
        source.includes('edr') || source.includes('access control')) {
        return 'simulation';
    }


    // Check raw_data for correlation/automation markers
    // Handle both property names: raw_data (SimulationContext) and rawData (incident types)
    const rawDataField = (alert as any).raw_data || (alert as any).rawData;

    if (rawDataField) {
        const rawData = typeof rawDataField === 'string'
            ? JSON.parse(rawDataField)
            : rawDataField;

        if (rawData?.correlation || rawData?.correlated) {
            return 'correlated';
        }

        if (rawData?.automated || rawData?.automation) {
            return 'automated';
        }

        if (rawData?.manual) {
            return 'manual';
        }
    }

    // Default fallback
    return 'unknown';
}

export function SourceBadge({ alert, showIcon = true, variant = 'default' }: SourceBadgeProps) {
    const source = detectAlertSource(alert);
    const config = SOURCE_CONFIGS[source];

    if (variant === 'compact') {
        return (
            <Badge
                variant="outline"
                className={`${config.bgColor} ${config.color} border-0 text-xs font-medium`}
                title={config.description}
            >
                {showIcon && <span className="mr-1">{config.icon}</span>}
                {config.label}
            </Badge>
        );
    }

    return (
        <div
            className={`inline-flex items-center px-2.5 py-1 rounded-md ${config.bgColor} ${config.color} text-xs font-medium`}
            title={config.description}
        >
            {showIcon && <span className="mr-1.5">{config.icon}</span>}
            <span>{config.label}</span>
        </div>
    );
}
