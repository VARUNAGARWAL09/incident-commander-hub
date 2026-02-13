
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Incident } from '@/context/IncidentsContext';
import { reportService } from '@/services/incidentReportService';
import { IncidentReport } from '@/types/incidentReport';
import { useAuth } from '@/context/AuthContext';
import { FileText, Save, Download, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { generateIncidentReportPDF } from '@/utils/pdfGenerator';
import { useSimulation } from '@/context/SimulationContext';

export function IncidentReportBuilder({ incident, relatedEvidence }: { incident: Incident, relatedEvidence?: any[] }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { evidence, alerts } = useSimulation();

    const [report, setReport] = useState<Partial<IncidentReport>>({
        incident_id: incident.id,
        executive_summary: { summary: '', timeline_summary: '', severity_assessment: incident.severity },
        technical_analysis: { attack_vector: '', mitre_techniques: [], iocs: [], correlated_alerts: [] },
        root_cause: { type: '', description: '', contributing_factors: [] },
        business_impact: { affected_systems: [], data_exposed: false, downtime_duration: '', risk_level: '' },
        remediation: { actions_taken: [], patches_applied: [], isolation_status: '' },
        compliance_mapping: { nist_detect: false, nist_respond: false, nist_recover: false, iso_controls: [] }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filter evidence/alerts for this incident ( prioritize prop if provided )
    const incidentEvidence = relatedEvidence && relatedEvidence.length > 0
        ? relatedEvidence
        : evidence.filter(e => e.incident_id === incident.id);

    // Selection state for evidence
    const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);

    // Track if we've already done the initial auto-selection
    const hasInitializedSelection = useRef(false);

    useEffect(() => {
        // Auto-select all available evidence initially only once
        if (incidentEvidence && incidentEvidence.length > 0 && !hasInitializedSelection.current) {
            setSelectedEvidenceIds(incidentEvidence.map(e => e.id));
            hasInitializedSelection.current = true;
        }
    }, [incidentEvidence]);
    const incidentAlerts = alerts.filter(a => a.incident_id === incident.id);

    useEffect(() => {
        let mounted = true;
        const loadReport = async () => {
            try {
                // Failsafe timeout in case DB is unresponsive
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
                const reportPromise = reportService.getReport(incident.id);

                // Wait for report or timeout
                const existing = await Promise.race([reportPromise, timeoutPromise.then(() => null)]);

                if (mounted && existing && (existing as any).id) {
                    setReport(existing as IncidentReport);
                }
            } catch (e) {
                console.error("Failed to load report", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadReport();
        return () => { mounted = false; };
    }, [incident.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // sanitize - remove system fields
            const { id, created_at, updated_at, incident_id, created_by, reviewed_by, approved_by, status, ...reportPayload } = report as IncidentReport;

            const saved = await reportService.createOrUpdateReport(incident.id, {
                ...reportPayload,
                created_by: report.created_by || user?.email || 'Unknown',
            });

            if (saved) {
                setReport(saved);
                toast({ title: 'Report Saved', description: 'Incident report updated successfully.' });
            } else {
                toast({ title: 'Error', description: 'Failed to save report. Ensure table exists.', variant: 'destructive' });
            }
        } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'Failed to save report.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = () => {
        const evidenceToInclude = incidentEvidence.filter(e => selectedEvidenceIds.includes(e.id));
        generateIncidentReportPDF(incident, report as IncidentReport, evidenceToInclude, incidentAlerts);
        toast({ title: 'Exported', description: 'PDF Report downloaded.' });
    };

    if (loading) return <div>Loading report data...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Incident Report: {incident.case_number}
                    </h2>
                    <div className="flex gap-2 mt-1">
                        <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>
                            {report.status?.toUpperCase() || 'DRAFT'}
                        </Badge>
                        {report.updated_at && <span className="text-xs text-muted-foreground self-center">Last updated: {new Date(report.updated_at).toLocaleString()}</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="executive" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="executive">Executive</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                    <TabsTrigger value="rootcause">Root Cause</TabsTrigger>
                    <TabsTrigger value="impact">Impact</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                {/* 1. Executive Summary */}
                <TabsContent value="executive">
                    <Card>
                        <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Incident Overview</Label>
                                <Textarea
                                    value={report.executive_summary?.summary || ''}
                                    onChange={e => setReport({ ...report, executive_summary: { ...report.executive_summary!, summary: e.target.value } })}
                                    placeholder="Provide a high-level overview of the incident..."
                                    className="h-32"
                                />
                            </div>
                            <div>
                                <Label>Timeline Summary</Label>
                                <Textarea
                                    value={report.executive_summary?.timeline_summary || ''}
                                    onChange={e => setReport({ ...report, executive_summary: { ...report.executive_summary!, timeline_summary: e.target.value } })}
                                    placeholder="Key milestones..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. Technical Analysis */}
                <TabsContent value="technical">
                    <Card>
                        <CardHeader><CardTitle>Technical Analysis</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Attack Vector</Label>
                                <Input
                                    value={report.technical_analysis?.attack_vector || ''}
                                    onChange={e => setReport({ ...report, technical_analysis: { ...report.technical_analysis!, attack_vector: e.target.value } })}
                                    placeholder="e.g. Phishing, Brute Force"
                                />
                            </div>
                            <div>
                                <Label>MITRE Techniques (comma separated)</Label>
                                <Input
                                    value={report.technical_analysis?.mitre_techniques?.join(', ') || ''}
                                    onChange={e => setReport({ ...report, technical_analysis: { ...report.technical_analysis!, mitre_techniques: e.target.value.split(',').map(s => s.trim()) } })}
                                />
                            </div>
                            <div>
                                <Label>IOCs (comma separated)</Label>
                                <Textarea
                                    value={report.technical_analysis?.iocs?.join(', ') || ''}
                                    onChange={e => setReport({ ...report, technical_analysis: { ...report.technical_analysis!, iocs: e.target.value.split(',').map(s => s.trim()) } })}
                                    placeholder="IPs, Hashes, Domains..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. Evidence Display (Read Only + Integrity) */}
                <TabsContent value="evidence">
                    <Card>
                        <CardHeader><CardTitle>Evidence & Integrity</CardTitle></CardHeader>
                        <CardContent>
                            {incidentEvidence.length === 0 ? (
                                <p className="text-muted-foreground">No evidence linked to this incident.</p>
                            ) : (
                                <div className="space-y-2">
                                    {incidentEvidence.map(e => (
                                        <div key={e.id} className="flex items-start gap-3 p-3 border rounded bg-secondary/20">
                                            <Checkbox
                                                checked={selectedEvidenceIds.includes(e.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedEvidenceIds(prev => [...prev, e.id]);
                                                    } else {
                                                        setSelectedEvidenceIds(prev => prev.filter(id => id !== e.id));
                                                    }
                                                }}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="font-semibold flex items-center gap-2">
                                                        {(e.type || 'unknown').toUpperCase()}
                                                        <Badge variant="outline">{e.classification}</Badge>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="text-green-500 h-6 px-2">
                                                        <ShieldCheck className="h-4 w-4 mr-1" /> Verified
                                                    </Button>
                                                </div>
                                                <p className="text-xs font-mono text-muted-foreground break-all">{e.value}</p>
                                                {e.description && <p className="text-sm mt-1">{e.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 4. Root Cause */}
                <TabsContent value="rootcause">
                    <Card>
                        <CardHeader><CardTitle>Root Cause Analysis</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Primary Cause</Label>
                                <Input
                                    value={report.root_cause?.type || ''}
                                    onChange={e => setReport({ ...report, root_cause: { ...report.root_cause!, type: e.target.value } })}
                                    placeholder="e.g. Misconfiguration, Zero-day"
                                />
                            </div>
                            <div>
                                <Label>Detailed Description</Label>
                                <Textarea
                                    value={report.root_cause?.description || ''}
                                    onChange={e => setReport({ ...report, root_cause: { ...report.root_cause!, description: e.target.value } })}
                                    className="h-32"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 5. Impact */}
                <TabsContent value="impact">
                    <Card>
                        <CardHeader><CardTitle>Business Impact</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Risk Level</Label>
                                    <Input
                                        value={report.business_impact?.risk_level || ''}
                                        onChange={e => setReport({ ...report, business_impact: { ...report.business_impact!, risk_level: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <Label>Downtime Duration</Label>
                                    <Input
                                        value={report.business_impact?.downtime_duration || ''}
                                        onChange={e => setReport({ ...report, business_impact: { ...report.business_impact!, downtime_duration: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={report.business_impact?.data_exposed || false}
                                    onCheckedChange={(c) => setReport({ ...report, business_impact: { ...report.business_impact!, data_exposed: c as boolean } })}
                                />
                                <Label>Sensitive Data Exposed</Label>
                            </div>
                            <div>
                                <Label>Affected Systems (comma separated)</Label>
                                <Input
                                    value={report.business_impact?.affected_systems?.join(', ') || ''}
                                    onChange={e => setReport({ ...report, business_impact: { ...report.business_impact!, affected_systems: e.target.value.split(',').map(s => s.trim()) } })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 6. Compliance */}
                <TabsContent value="compliance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance Mapping</CardTitle>
                            <CardDescription>Select applicable controls and frameworks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-2">NIST Cybersecurity Framework</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={report.compliance_mapping?.nist_detect || false}
                                            onCheckedChange={c => setReport({ ...report, compliance_mapping: { ...report.compliance_mapping!, nist_detect: c as boolean } })}
                                        />
                                        <Label>Detect (DE)</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={report.compliance_mapping?.nist_respond || false}
                                            onCheckedChange={c => setReport({ ...report, compliance_mapping: { ...report.compliance_mapping!, nist_respond: c as boolean } })}
                                        />
                                        <Label>Respond (RS)</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={report.compliance_mapping?.nist_recover || false}
                                            onCheckedChange={c => setReport({ ...report, compliance_mapping: { ...report.compliance_mapping!, nist_recover: c as boolean } })}
                                        />
                                        <Label>Recover (RC)</Label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">ISO 27001 Controls</h4>
                                {['A.16 Incident Management', 'A.12 Operations Security', 'A.9 Access Control'].map(control => (
                                    <div key={control} className="flex items-center gap-2 mt-1">
                                        <Checkbox
                                            checked={report.compliance_mapping?.iso_controls?.includes(control) || false}
                                            onCheckedChange={c => {
                                                const current = report.compliance_mapping?.iso_controls || [];
                                                const updated = c
                                                    ? [...current, control]
                                                    : current.filter(x => x !== control);
                                                setReport({ ...report, compliance_mapping: { ...report.compliance_mapping!, iso_controls: updated } });
                                            }}
                                        />
                                        <Label>{control}</Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
