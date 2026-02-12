/**
 * Log Ingestion Page
 * 
 * Complete standalone log analysis and alert generation interface.
 * This module is architecturally isolated from the simulation system.
 * 
 * Features:
 * - File upload (*.log, *.txt)
 * - Real-time parsing with progress tracking
 * - Alert generation from detections
 * - Processing summary and statistics
 * - Sample log generator for testing
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Download,
    Shield,
    Activity,
    Zap,
    TrendingUp,
    Clock,
    Database,
    ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { parseLogFile, validateLogFile, readFileContent } from '@/utils/logParser';
import { processDetections, validateConnection, getLogAlertStats } from '@/services/LogIngestionService';
import { supabase } from '@/integrations/supabase/client';
import type { ParsedLogResult, LogDetection } from '@/types/logIngestion';

const LogIngestion = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<ParsedLogResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [summary, setSummary] = useState<any>(null);
    const [previewContent, setPreviewContent] = useState<string>('');

    /**
     * Handle file selection
     */
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset previous state
        setParseResult(null);
        setSummary(null);
        setPreviewContent('');

        // Validate file
        const validation = validateLogFile(file);
        if (!validation.valid) {
            toast({
                title: 'Invalid File',
                description: validation.error,
                variant: 'destructive',
            });
            return;
        }

        setSelectedFile(file);

        // Show preview
        try {
            const content = await readFileContent(file);
            const lines = content.split('\n').slice(0, 20);
            setPreviewContent(lines.join('\n') + (content.split('\n').length > 20 ? '\n...' : ''));

            toast({
                title: 'File Loaded',
                description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
            });
        } catch (error) {
            toast({
                title: 'Error Reading File',
                description: 'Failed to read file content',
                variant: 'destructive',
            });
        }
    };

    /**
     * Parse log file and detect threats
     */
    const handleParseLogs = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        setProcessingStatus('Reading file...');
        setProcessingProgress(20);

        try {
            // Read file content
            const content = await readFileContent(selectedFile);

            setProcessingStatus('Analyzing patterns...');
            setProcessingProgress(40);

            // Parse log file
            const result = parseLogFile(content, selectedFile.name);
            setParseResult(result);

            setProcessingStatus('Detection complete');
            setProcessingProgress(100);

            toast({
                title: 'Log Analysis Complete',
                description: `Found ${result.detections.length} potential threats in ${result.totalLines} lines`,
            });
        } catch (error) {
            console.error('Error parsing log file:', error);
            toast({
                title: 'Parsing Failed',
                description: 'An error occurred while analyzing the log file',
                variant: 'destructive',
            });
        } finally {
            setTimeout(() => {
                setIsProcessing(false);
                setProcessingProgress(0);
                setProcessingStatus('');
            }, 500);
        }
    };

    /**
     * Generate alerts from detections
     */
    const handleGenerateAlerts = async () => {
        if (!parseResult || !selectedFile) return;

        // Validate database connection
        const isConnected = await validateConnection();
        if (!isConnected) {
            toast({
                title: 'Database Connection Failed',
                description: 'Unable to connect to Supabase. Please check your connection.',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        setProcessingStatus('Generating alerts...');
        setProcessingProgress(0);

        try {
            // Process detections and insert alerts
            const result = await processDetections(
                parseResult.detections,
                selectedFile.name,
                (current, total) => {
                    setProcessingProgress((current / total) * 100);
                    setProcessingStatus(`Processing ${current}/${total} detections...`);
                }
            );

            setSummary(result);

            toast({
                title: 'Alerts Generated Successfully',
                description: `Created ${result.alertsGenerated} alerts (${result.criticalAlerts} critical, ${result.highAlerts} high)`,
            });

            // Refresh stats
            const stats = await getLogAlertStats();
            console.log('Log alert statistics:', stats);
        } catch (error) {
            console.error('Error generating alerts:', error);
            toast({
                title: 'Alert Generation Failed',
                description: 'An error occurred while creating alerts',
                variant: 'destructive',
            });
        } finally {
            setTimeout(() => {
                setIsProcessing(false);
                setProcessingProgress(0);
                setProcessingStatus('');
            }, 500);
        }
    };

    /**
     * Generate sample log file for testing
     */
    const generateSampleLog = () => {
        const sampleLogs = [
            // SSH Brute Force
            '2024-02-12 10:15:23 [AUTH] Failed password for admin from 203.0.113.45 port 22',
            '2024-02-12 10:15:25 [AUTH] Failed password for root from 203.0.113.45 port 22',
            '2024-02-12 10:15:27 [AUTH] Failed password for admin from 203.0.113.45 port 22',
            '2024-02-12 10:15:29 [AUTH] Failed login attempt from 203.0.113.45',
            '2024-02-12 10:15:31 [AUTH] Authentication failure for user root from 203.0.113.45',
            '',
            // SQL Injection
            '2024-02-12 10:20:15 [WEB] GET /search?q=\' OR 1=1-- from 198.51.100.23',
            '2024-02-12 10:20:18 [WEB] POST /login?username=admin\' OR \'1\'=\'1 from 198.51.100.23',
            '2024-02-12 10:20:22 [WEB] GET /api/users?id=1 UNION SELECT * FROM passwords from 198.51.100.23',
            '',
            // Malware Detection
            '2024-02-12 10:25:00 [AV] Detected ransomware signature in C:\\\\Temp\\\\malicious.exe',
            '2024-02-12 10:25:05 [EDR] Trojan.Generic found on WORKSTATION-05',
            '2024-02-12 10:25:10 [AV] Backdoor detected in system32 folder',
            '',
            // Large Data Transfer
            '2024-02-12 10:30:00 [FIREWALL] Outbound connection: 5.2 GB transferred to 104.24.104.24',
            '2024-02-12 10:30:15 [DLP] Large data upload detected: 3500 MB sent to external cloud',
            '',
            // Privilege Escalation
            '2024-02-12 10:35:00 [AUDIT] User jdoe executed sudo su root on SERVER-01',
            '2024-02-12 10:35:05 [SECURITY] Privilege escalation attempt detected for user hacker',
            '',
            // Port Scanning
            '2024-02-12 10:40:00 [IDS] Port scan detected from 192.0.2.100',
            '2024-02-12 10:40:02 [IDS] Reconnaissance activity: nmap scan from 192.0.2.100',
            '',
            // Unauthorized Access
            '2024-02-12 10:45:00 [WEB] 403 Forbidden - User unauthorized_user attempting /admin',
            '2024-02-12 10:45:05 [API] 401 Unauthorized - Access denied to /api/secrets',
            '2024-02-12 10:45:10 [AUTH] Permission denied for user guest accessing /confidential',
            '',
            // Credential Harvesting
            '2024-02-12 10:50:00 [EDR] Mimikatz activity detected on WORKSTATION-12',
            '2024-02-12 10:50:05 [SECURITY] Password dump attempt from lsass.exe',
            '',
            // Normal traffic (should not trigger)
            '2024-02-12 11:00:00 [INFO] User alice logged in successfully',
            '2024-02-12 11:00:05 [INFO] Application started normally',
            '2024-02-12 11:00:10 [INFO] Database connection established',
        ];

        const content = sampleLogs.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample_security.log';
        link.click();
        URL.revokeObjectURL(url);

        toast({
            title: 'Sample Log Generated',
            description: 'Download started. Upload this file to test the log ingestion feature.',
        });
    };

    /**
     * Debug: Check database for log-based alerts
     */
    const handleDebugCheckAlerts = async () => {
        try {
            console.log('🔍 Checking database for log-based alerts...');

            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .like('source', 'Log Analysis:%')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error querying alerts:', error);
                toast({
                    title: 'Database Query Failed',
                    description: error.message,
                    variant: 'destructive',
                });
                return;
            }

            console.log(`✅ Found ${data?.length || 0} log-based alerts in database:`);
            data?.forEach((alert: any) => {
                console.log(`  - ${alert.title} (${alert.severity}) - Created: ${alert.created_at}`);
            });

            toast({
                title: 'Database Check Complete',
                description: `Found ${data?.length || 0} log-based alerts in database. Check console for details.`,
            });
        } catch (error) {
            console.error('❌ Unexpected error checking alerts:', error);
        }
    };

    /**
     * Get severity badge color
     */
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'high':
                return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'low':
                return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-mono text-2xl font-bold tracking-tight"
                        >
                            Log Ingestion & Analysis
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-muted-foreground mt-1"
                        >
                            Upload security logs for automated threat detection
                        </motion.p>
                    </div>

                    <Button onClick={generateSampleLog} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Sample Log
                    </Button>

                    <Button onClick={handleDebugCheckAlerts} variant="secondary" className="gap-2">
                        <Database className="h-4 w-4" />
                        Check Database
                    </Button>
                </div>

                {/* Info Alert */}
                <Alert className="border-blue-500/50 bg-blue-500/10">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-blue-500">Isolated Module</AlertTitle>
                    <AlertDescription>
                        This feature is completely independent. Alerts generated here will appear in your
                        dashboard automatically through real-time sync. No existing data is modified.
                    </AlertDescription>
                </Alert>

                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload Log File
                        </CardTitle>
                        <CardDescription>
                            Supported formats: *.log, *.txt | Max size: 500MB
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                id="log-file"
                                accept=".log,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <label htmlFor="log-file">
                                <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                                    <span>
                                        <FileText className="h-4 w-4" />
                                        Select File
                                    </span>
                                </Button>
                            </label>

                            {selectedFile && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm font-medium">{selectedFile.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({(selectedFile.size / 1024).toFixed(2)} KB)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* File Preview */}
                        {previewContent && (
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-2">Preview (First 20 lines)</h4>
                                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-60 overflow-y-auto font-mono">
                                    {previewContent}
                                </pre>
                            </div>
                        )}

                        {/* Parse Button */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleParseLogs}
                                disabled={!selectedFile || isProcessing}
                                className="gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4" />
                                        Analyze Logs
                                    </>
                                )}
                            </Button>

                            {parseResult && !isProcessing && (
                                <Button
                                    onClick={handleGenerateAlerts}
                                    variant="default"
                                    className="gap-2"
                                >
                                    <Database className="h-4 w-4" />
                                    Generate Alerts ({parseResult.detections.length})
                                </Button>
                            )}
                        </div>

                        {/* Processing Progress */}
                        {isProcessing && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{processingStatus}</span>
                                    <span className="font-medium">{Math.round(processingProgress)}%</span>
                                </div>
                                <Progress value={processingProgress} className="h-2" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Parse Results */}
                <AnimatePresence>
                    {parseResult && !isProcessing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Statistics */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Lines</p>
                                                <p className="text-2xl font-bold">{parseResult.totalLines}</p>
                                            </div>
                                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Detections</p>
                                                <p className="text-2xl font-bold">{parseResult.detections.length}</p>
                                            </div>
                                            <AlertTriangle className="h-8 w-8 text-orange-500/50" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Critical Threats</p>
                                                <p className="text-2xl font-bold text-red-500">
                                                    {parseResult.detections.filter(d => d.severity === 'critical').length}
                                                </p>
                                            </div>
                                            <Shield className="h-8 w-8 text-red-500/50" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Processing Time</p>
                                                <p className="text-2xl font-bold">
                                                    {parseResult.processingTime.toFixed(0)}ms
                                                </p>
                                            </div>
                                            <Clock className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detections List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Detected Threats
                                    </CardTitle>
                                    <CardDescription>
                                        Security patterns and anomalies found in the log file
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {parseResult.detections.map((detection, index) => (
                                            <div
                                                key={detection.rule.id}
                                                className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold">{detection.rule.name}</h4>
                                                            <Badge className={getSeverityColor(detection.severity)}>
                                                                {detection.severity.toUpperCase()}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                Risk: {detection.riskScore}/100
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {detection.rule.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Occurrences</p>
                                                        <p className="font-semibold">
                                                            {detection.aggregatedMetadata.totalOccurrences}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Unique IPs</p>
                                                        <p className="font-semibold">
                                                            {detection.aggregatedMetadata.uniqueIPs}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Category</p>
                                                        <p className="font-semibold">{detection.rule.category}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">MITRE ATT&CK</p>
                                                        <p className="font-semibold text-xs">
                                                            {detection.rule.mitreAttack?.join(', ') || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {detection.aggregatedMetadata.topIPs?.length > 0 && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">Top Source IPs:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {detection.aggregatedMetadata.topIPs.slice(0, 5).map((item: any) => (
                                                                <Badge key={item.ip} variant="secondary" className="text-xs">
                                                                    {item.ip} ({item.count}×)
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <details className="text-sm">
                                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                                        View sample log entry
                                                    </summary>
                                                    <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-x-auto">
                                                        {detection.matches[0]?.rawLine}
                                                    </pre>
                                                </details>
                                            </div>
                                        ))}

                                        {parseResult.detections.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                                <p className="font-medium">No threats detected</p>
                                                <p className="text-sm">The log file appears clean</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Summary */}
                <AnimatePresence>
                    {summary && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Alert className={summary.alertsGenerated === 0 ? "border-yellow-500/50 bg-yellow-500/10" : "border-green-500/50 bg-green-500/10"}>
                                {summary.alertsGenerated === 0 ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                <AlertTitle className={summary.alertsGenerated === 0 ? "text-yellow-500" : "text-green-500"}>
                                    {summary.alertsGenerated === 0 ? "No New Alerts Generated" : "Processing Complete"}
                                </AlertTitle>
                                <AlertDescription>
                                    {summary.alertsGenerated === 0 && summary.skippedDuplicates > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-sm">
                                                All {summary.skippedDuplicates} detection(s) were skipped because identical alerts from this file
                                                already exist in the database (created within the last 24 hours).
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                💡 Tip: Duplicate prevention ensures the same log file doesn't create redundant alerts.
                                                To generate alerts again, wait 24 hours or process a different log file.
                                            </p>
                                        </div>
                                    ) : summary.alertsGenerated === 0 ? (
                                        <p className="text-sm">No alerts were generated. Check the console for details.</p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                                                <div>
                                                    <strong>Alerts Generated:</strong> {summary.alertsGenerated}
                                                </div>
                                                {summary.skippedDuplicates > 0 && (
                                                    <div className="text-yellow-600">
                                                        <strong>Skipped (Duplicates):</strong> {summary.skippedDuplicates}
                                                    </div>
                                                )}
                                                <div>
                                                    <strong>Critical:</strong> {summary.criticalAlerts}
                                                </div>
                                                <div>
                                                    <strong>High:</strong> {summary.highAlerts}
                                                </div>
                                                <div>
                                                    <strong>Medium:</strong> {summary.mediumAlerts}
                                                </div>
                                                <div>
                                                    <strong>Low:</strong> {summary.lowAlerts}
                                                </div>
                                                <div>
                                                    <strong>Time:</strong> {summary.processingTime.toFixed(0)}ms
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <p className="text-xs flex-1">
                                                    ✓ All alerts are now visible in the Alerts page via real-time sync
                                                </p>
                                                <Button
                                                    onClick={() => navigate('/alerts')}
                                                    size="sm"
                                                    variant="secondary"
                                                    className="gap-2"
                                                >
                                                    View Alerts
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MainLayout>
    );
};

export default LogIngestion;
