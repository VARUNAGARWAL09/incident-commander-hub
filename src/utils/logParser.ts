/**
 * Log Parser Utility
 * 
 * Rule-based detection engine for parsing security logs.
 * This module is completely independent and does not modify any existing systems.
 * 
 * Features:
 * - Pattern-based threat detection
 * - Configurable detection rules
 * - Anomaly scoring
 * - Metadata extraction
 */

import type {
    DetectionRule,
    LogEntry,
    LogDetection,
    LogMatch,
    ParsedLogResult,
} from '@/types/logIngestion';

/**
 * Detection Rules Configuration
 * Each rule defines a pattern to match and associated metadata
 */
export const DETECTION_RULES: DetectionRule[] = [
    {
        id: 'brute-force-ssh',
        name: 'SSH Brute Force Attack',
        description: 'Multiple failed SSH login attempts from same IP',
        pattern: /failed\s+password|authentication\s+failure|failed\s+login/i,
        severity: 'high',
        riskScore: 75,
        category: 'Brute Force',
        mitreAttack: ['T1110.001'],
        recommendedActions: [
            'Block source IP in firewall',
            'Enable multi-factor authentication',
            'Review SSH access logs',
        ],
    },
    {
        id: 'sql-injection',
        name: 'SQL Injection Attempt',
        description: 'Potential SQL injection pattern detected in request',
        pattern: /('|")\s*(or|and)\s+('|")?1('|")?\s*=\s*('|")?1|union\s+select|drop\s+table|insert\s+into|update\s+.*\s+set/i,
        severity: 'critical',
        riskScore: 95,
        category: 'Injection Attack',
        mitreAttack: ['T1190'],
        recommendedActions: [
            'Block malicious IP immediately',
            'Review application input validation',
            'Check database for unauthorized changes',
            'Escalate to security team',
        ],
    },
    {
        id: 'suspicious-ip',
        name: 'Suspicious IP Pattern',
        description: 'Traffic from known malicious IP ranges',
        pattern: /(?:10\.0\.0\.1|192\.168\.1\.1|suspicious|malicious|blocked|blacklist)/i,
        severity: 'medium',
        riskScore: 60,
        category: 'Network Anomaly',
        mitreAttack: ['T1071'],
        recommendedActions: [
            'Verify IP reputation',
            'Check threat intelligence feeds',
            'Monitor for additional activity',
        ],
    },
    {
        id: 'excessive-requests',
        name: 'Excessive Request Rate',
        description: 'Abnormally high request rate from single IP',
        pattern: /\b([0-9]{1,3}\.){3}[0-9]{1,3}\b.*\b(GET|POST|PUT|DELETE)\b/gi,
        severity: 'medium',
        riskScore: 55,
        category: 'Rate Limiting',
        mitreAttack: ['T1498'],
        recommendedActions: [
            'Implement rate limiting',
            'Consider temporary IP block',
            'Monitor for DDoS patterns',
        ],
    },
    {
        id: 'large-data-transfer',
        name: 'Large Outbound Data Transfer',
        description: 'Unusually large data transfer detected',
        pattern: /\b(\d+)\s*(mb|gb|bytes)\s*(transferred|upload|outbound|sent)/i,
        severity: 'high',
        riskScore: 70,
        category: 'Data Exfiltration',
        mitreAttack: ['T1048'],
        recommendedActions: [
            'Investigate data destination',
            'Review user activity',
            'Check for unauthorized file access',
        ],
    },
    {
        id: 'privilege-escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Attempt to elevate privileges detected',
        pattern: /sudo|su\s+root|privilege.*escalat|unauthorized.*admin|elevat.*privilege/i,
        severity: 'critical',
        riskScore: 90,
        category: 'Privilege Escalation',
        mitreAttack: ['T1068', 'T1078'],
        recommendedActions: [
            'Lock affected user account',
            'Review system logs for rootkit',
            'Perform security audit',
            'Escalate to incident response team',
        ],
    },
    {
        id: 'malware-signature',
        name: 'Malware Signature Detected',
        description: 'Known malware pattern or signature found',
        pattern: /malware|virus|trojan|ransomware|backdoor|rootkit|exploit/i,
        severity: 'critical',
        riskScore: 98,
        category: 'Malware',
        mitreAttack: ['T1204', 'T1486'],
        recommendedActions: [
            'Quarantine affected system immediately',
            'Run full antivirus scan',
            'Check for lateral movement',
            'Initiate incident response protocol',
        ],
    },
    {
        id: 'unauthorized-access',
        name: 'Unauthorized Access Attempt',
        description: 'Access to restricted resource without authorization',
        pattern: /unauthorized|access\s+denied|403\s+forbidden|401\s+unauthorized|permission\s+denied/i,
        severity: 'medium',
        riskScore: 50,
        category: 'Access Control',
        mitreAttack: ['T1078'],
        recommendedActions: [
            'Review access control lists',
            'Verify user permissions',
            'Check for account compromise',
        ],
    },
    {
        id: 'port-scan',
        name: 'Port Scanning Activity',
        description: 'Network port scanning behavior detected',
        pattern: /port\s+scan|nmap|scanning\s+ports|probe|reconnaissance/i,
        severity: 'medium',
        riskScore: 65,
        category: 'Reconnaissance',
        mitreAttack: ['T1046'],
        recommendedActions: [
            'Block scanning IP',
            'Enable IDS/IPS rules',
            'Monitor for follow-up attacks',
        ],
    },
    {
        id: 'credential-harvesting',
        name: 'Credential Harvesting',
        description: 'Potential credential theft or harvesting attempt',
        pattern: /password.*dump|credential.*harvest|mimikatz|lsass|hashdump/i,
        severity: 'critical',
        riskScore: 92,
        category: 'Credential Theft',
        mitreAttack: ['T1003'],
        recommendedActions: [
            'Force password reset for affected accounts',
            'Review authentication logs',
            'Check for unauthorized access',
            'Deploy endpoint detection',
        ],
    },
];

/**
 * Extract IP addresses from log line
 */
function extractIPs(line: string): string[] {
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    return line.match(ipPattern) || [];
}

/**
 * Extract timestamp from log line (supports multiple formats)
 */
function extractTimestamp(line: string): string | null {
    // ISO 8601 format
    const iso8601 = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/;
    const isoMatch = line.match(iso8601);
    if (isoMatch) return isoMatch[0];

    // Common log format
    const commonLog = /\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/;
    const commonMatch = line.match(commonLog);
    if (commonMatch) return commonMatch[0];

    // Syslog format
    const syslog = /\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/;
    const syslogMatch = line.match(syslog);
    if (syslogMatch) return syslogMatch[0];

    return new Date().toISOString();
}

/**
 * Extract data size from log line (MB, GB, etc.)
 */
function extractDataSize(line: string): number | null {
    const sizePattern = /(\d+(?:\.\d+)?)\s*(bytes?|kb|mb|gb|tb)/i;
    const match = line.match(sizePattern);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
        bytes: 1,
        byte: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
        tb: 1024 * 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
}

/**
 * Count occurrences of pattern in log lines
 */
function countOccurrences(lines: string[], pattern: RegExp): number {
    return lines.filter(line => pattern.test(line)).length;
}

/**
 * Group log matches by IP address for frequency analysis
 */
function groupByIP(matches: LogMatch[]): Map<string, LogMatch[]> {
    const grouped = new Map<string, LogMatch[]>();

    matches.forEach(match => {
        const ips = extractIPs(match.rawLine);
        ips.forEach(ip => {
            if (!grouped.has(ip)) {
                grouped.set(ip, []);
            }
            grouped.get(ip)!.push(match);
        });
    });

    return grouped;
}

/**
 * Calculate dynamic risk score based on frequency and context
 */
function calculateDynamicRiskScore(
    baseScore: number,
    matches: LogMatch[],
    allLines: string[]
): number {
    let score = baseScore;

    // Frequency multiplier (more occurrences = higher risk)
    const frequency = matches.length;
    if (frequency > 10) score = Math.min(100, score + 10);
    if (frequency > 50) score = Math.min(100, score + 10);
    if (frequency > 100) score = Math.min(100, score + 10);

    // IP diversity (attacks from multiple IPs = higher risk)
    const uniqueIPs = new Set(matches.flatMap(m => extractIPs(m.rawLine)));
    if (uniqueIPs.size > 5) score = Math.min(100, score + 5);

    // Time concentration (attacks in short window = higher risk)
    const timestamps = matches.map(m => new Date(m.timestamp).getTime()).filter(t => !isNaN(t));
    if (timestamps.length > 1) {
        const timeRange = Math.max(...timestamps) - Math.min(...timestamps);
        const hoursDuration = timeRange / (1000 * 60 * 60);
        if (hoursDuration < 1 && matches.length > 5) {
            score = Math.min(100, score + 10); // Concentrated attack
        }
    }

    return Math.round(score);
}

/**
 * Determine severity based on risk score
 */
function determineSeverity(riskScore: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 50) return 'medium';
    if (riskScore >= 30) return 'low';
    return 'info';
}

/**
 * Parse log file content and detect threats
 */
export function parseLogFile(content: string, fileName: string): ParsedLogResult {
    const startTime = performance.now();

    // Split content into lines
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    const totalLines = lines.length;

    // Store all detections
    const detectionsMap = new Map<string, LogDetection>();

    // Process each detection rule
    DETECTION_RULES.forEach(rule => {
        const matches: LogMatch[] = [];

        lines.forEach((line, index) => {
            if (rule.pattern.test(line)) {
                const timestamp = extractTimestamp(line) || new Date().toISOString();
                const ips = extractIPs(line);
                const dataSize = extractDataSize(line);

                matches.push({
                    lineNumber: index + 1,
                    rawLine: line,
                    timestamp,
                    extractedData: {
                        ips,
                        dataSize,
                        timestamp,
                    },
                });
            }
        });

        // Only create detection if matches found
        if (matches.length > 0) {
            // Calculate dynamic risk score
            const dynamicRiskScore = calculateDynamicRiskScore(rule.riskScore, matches, lines);
            const severity = determineSeverity(dynamicRiskScore);

            // Aggregate metadata
            const allIPs = matches.flatMap(m => extractIPs(m.rawLine));
            const uniqueIPs = [...new Set(allIPs)];
            const ipFrequency = new Map<string, number>();

            allIPs.forEach(ip => {
                ipFrequency.set(ip, (ipFrequency.get(ip) || 0) + 1);
            });

            // Sort IPs by frequency
            const topIPs = Array.from(ipFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([ip, count]) => ({ ip, count }));

            detectionsMap.set(rule.id, {
                rule,
                matches,
                severity,
                riskScore: dynamicRiskScore,
                aggregatedMetadata: {
                    totalOccurrences: matches.length,
                    uniqueIPs: uniqueIPs.length,
                    topIPs,
                    affectedLines: matches.map(m => m.lineNumber),
                    timeRange: {
                        first: matches[0]?.timestamp,
                        last: matches[matches.length - 1]?.timestamp,
                    },
                },
            });
        }
    });

    const detections = Array.from(detectionsMap.values());
    const processingTime = performance.now() - startTime;

    return {
        fileName,
        totalLines,
        detections,
        processingTime,
    };
}

/**
 * Validate log file format
 */
export function validateLogFile(file: File): { valid: boolean; error?: string } {
    const validExtensions = ['.log', '.txt'];
    const maxSize = 500 * 1024 * 1024; // 500MB limit

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
        return {
            valid: false,
            error: `Invalid file type. Accepted formats: ${validExtensions.join(', ')}`,
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty',
        };
    }

    return { valid: true };
}

/**
 * Read file content as text
 */
export function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(content);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}
