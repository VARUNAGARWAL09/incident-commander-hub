
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IncidentReportBuilder } from './IncidentReportBuilder';
import { Incident } from '@/context/IncidentsContext';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AttackTimeline } from '@/components/incidents/AttackTimeline';
import { useSimulation } from '@/context/SimulationContext';
import { FileText, Clock, Info, ShieldCheck } from 'lucide-react';

interface IncidentDetailModalProps {
    incident: Incident;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function IncidentDetailModal({ incident, open, onOpenChange }: IncidentDetailModalProps) {
    const { alerts, evidence } = useSimulation();
    const incidentAlerts = alerts.filter(a => a.incident_id === incident.id);
    const incidentEvidence = evidence.filter(e => e.incident_id === incident.id);

    // Mock alerts for critical/high incidents if none exists
    let displayAlerts = [...incidentAlerts];
    if (displayAlerts.length === 0 && (incident.severity === 'critical' || incident.severity === 'high')) {
        const now = Date.now();
        // @ts-ignore
        displayAlerts = [
            {
                id: 'mock-1',
                title: 'Initial Access: Phishing Email Detected',
                description: 'Suspicious email with malicious attachment delivered to endpoint.',
                severity: 'medium',
                created_at: new Date(now - 7200000).toISOString(),
                source: 'Email Gateway',
                raw_data: { sender: 'attacker@bad-domain.com' }
            },
            {
                id: 'mock-2',
                title: 'Execution: Suspicious PowerShell Command',
                description: 'Encoded PowerShell command executed by limited user.',
                severity: 'high',
                created_at: new Date(now - 5400000).toISOString(),
                source: 'EDR',
                raw_data: { command: 'powershell.exe -enc ...' }
            },
            {
                id: 'mock-3',
                title: 'defense Evasion: Security Tools tampering',
                description: 'Attempt to disable antivirus service detected.',
                severity: 'high',
                created_at: new Date(now - 3600000).toISOString(),
                source: 'EDR',
                raw_data: { service: 'WinDefend' }
            },
            {
                id: 'mock-4',
                title: 'Lateral Movement: RDP Brute Force',
                description: 'Multiple failed RDP login attempts followed by success.',
                severity: 'critical',
                created_at: new Date(now - 1800000).toISOString(),
                source: 'Network Logs',
                raw_data: { failures: 25 }
            },
            {
                id: 'mock-5',
                title: 'Exfiltration: High Volume Data Transfer',
                description: 'Large data upload to external IP address detected.',
                severity: 'critical',
                created_at: new Date(now - 600000).toISOString(),
                source: 'Firewall',
                raw_data: { bytes_out: 5368709120 }
            }
        ];
    }

    // Mock evidence for critical/high incidents if none exists
    let displayEvidence = [...incidentEvidence];
    if (displayEvidence.length === 0 && (incident.severity === 'critical' || incident.severity === 'high')) {
        // @ts-ignore
        displayEvidence = [
            {
                id: 'mock-ev-1',
                type: 'email',
                value: 'attacker@bad-domain.com',
                description: 'Sender of the initial phishing email.',
                classification: 'suspicious',
                incident_id: incident.id,
                created_at: new Date().toISOString(),
                image_url: null
            },
            {
                id: 'mock-ev-2',
                type: 'file',
                value: 'invoice.pdf.exe',
                description: 'Malicious attachment identified as Trojan.',
                classification: 'malicious',
                incident_id: incident.id,
                created_at: new Date().toISOString(),
                image_url: null
            },
            {
                id: 'mock-ev-3',
                type: 'ip',
                value: '203.0.113.55',
                description: 'Destination IP for data exfiltration (C2 Server).',
                classification: 'malicious',
                incident_id: incident.id,
                created_at: new Date().toISOString(),
                image_url: null
            },
            {
                id: 'mock-ev-4',
                type: 'hash',
                value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                description: 'SHA-256 hash of the dropped payload.',
                classification: 'malicious',
                incident_id: incident.id,
                created_at: new Date().toISOString(),
                image_url: null
            }
        ];
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1000px] h-[90vh] flex flex-col p-0 gap-0">
                <div className="p-6 pb-2 border-b">
                    <DialogHeader>
                        <DialogTitle className="font-mono flex items-center gap-3 text-xl">
                            <span className="text-primary">{incident.case_number}</span>
                            <SeverityBadge severity={incident.severity} />
                            <StatusBadge status={incident.status} />
                        </DialogTitle>
                        <h2 className="text-lg font-semibold mt-2">{incident.title}</h2>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 py-2 border-b bg-muted/40">
                        <TabsList>
                            <TabsTrigger value="overview" className="gap-2"><Info className="h-4 w-4" /> Overview</TabsTrigger>
                            <TabsTrigger value="timeline" className="gap-2"><Clock className="h-4 w-4" /> Timeline</TabsTrigger>
                            <TabsTrigger value="evidence" className="gap-2"><ShieldCheck className="h-4 w-4" /> Evidence ({displayEvidence.length})</TabsTrigger>
                            <TabsTrigger value="report" className="gap-2"><FileText className="h-4 w-4" /> Report & Compliance</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-secondary/10">
                        <TabsContent value="overview" className="mt-0 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-card rounded-lg border">
                                    <h3 className="font-semibold mb-2">Description</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{incident.description || 'No description.'}</p>
                                </div>
                                <div className="p-4 bg-card rounded-lg border space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-sm mb-1">Created At</h3>
                                        <p className="font-mono text-sm">{new Date(incident.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm mb-1">Last Updated</h3>
                                        <p className="font-mono text-sm">{new Date(incident.updated_at).toLocaleString()}</p>
                                    </div>
                                    <div className="pt-2">
                                        <h3 className="font-semibold text-sm mb-2">Metrics</h3>
                                        <div className="flex gap-4">
                                            <Badge variant="outline">{displayAlerts.length ?? 0} Alerts</Badge>
                                            <Badge variant="outline">{displayEvidence.length ?? 0} Evidence</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="timeline" className="mt-0">
                            <div className="bg-card p-4 rounded-lg border">
                                <h3 className="font-semibold mb-4">Attack Timeline</h3>
                                <AttackTimeline incidentId={incident.id} alerts={displayAlerts} severity={incident.severity} />
                            </div>
                        </TabsContent>

                        <TabsContent value="evidence" className="mt-0">
                            <div className="grid gap-4">
                                {displayEvidence.length > 0 ? displayEvidence.map(ev => (
                                    <div key={ev.id} className="p-4 bg-card rounded-lg border flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge>{ev.type}</Badge>
                                                <span className="font-mono text-xs text-muted-foreground">{ev.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="font-mono text-sm bg-muted p-2 rounded mt-2">{ev.value}</p>
                                            <p className="text-sm mt-2">{ev.description}</p>
                                        </div>
                                        <Badge variant={ev.classification === 'malicious' ? 'destructive' : 'outline'}>
                                            {ev.classification}
                                        </Badge>
                                    </div>
                                )) : <p className="text-center py-10 text-muted-foreground">No evidence collected yet.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="report" className="mt-0">
                            <IncidentReportBuilder incident={incident} relatedEvidence={displayEvidence} />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
