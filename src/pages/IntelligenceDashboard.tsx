/**
 * Intelligence Dashboard
 * 
 * Demonstration page showcasing all intelligent SOC features.
 * Provides controls to test and visualize the enhancements.
 */

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
    Shield,
    Brain,
    Link,
    Zap,
    Clock,
    Tag,
    CheckCircle,
    TrendingUp
} from 'lucide-react';
import { SourceBadge } from '@/components/common/SourceBadge';
import { AttackTimeline } from '@/components/incidents/AttackTimeline';
import { IntegrityBadge } from '@/components/evidence/IntegrityBadge';
import { useRiskScoring } from '@/hooks/useRiskScoring';
import { useEvidenceIntegrity } from '@/hooks/useEvidenceIntegrity';

export default function IntelligenceDashboard() {
    const { scoreAlert } = useRiskScoring(true);
    const { verifyIntegrity, verifying } = useEvidenceIntegrity();
    const [demoTab, setDemoTab] = useState('overview');

    // Sample data for timeline demo
    const sampleAlerts = [
        {
            id: '1',
            title: 'Suspicious Login Attempt',
            severity: 'medium' as const,
            source: 'Azure AD',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            raw_data: { mitre_techniques: ['T1078'] }
        },
        {
            id: '2',
            title: 'Brute Force Attack Detected',
            severity: 'high' as const,
            source: 'Firewall Logs',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            raw_data: { mitre_techniques: ['T1110'] }
        },
        {
            id: '3',
            title: 'Data Exfiltration Alert',
            severity: 'critical' as const,
            source: 'Netskope DLP',
            created_at: new Date(Date.now() - 600000).toISOString(),
            raw_data: { mitre_techniques: ['T1048', 'T1567'] }
        }
    ];

    const features = [
        {
            id: 'source-attribution',
            icon: Tag,
            title: 'Source Attribution',
            description: 'Visual badges identify alert origins (Simulation, Log Analysis, Correlated, etc.)',
            status: 'active',
            color: 'text-green-600'
        },
        {
            id: 'attack-timeline',
            icon: Clock,
            title: 'Attack Timeline View',
            description: 'Chronological visualization of security events with escalation detection',
            status: 'active',
            color: 'text-blue-600'
        },
        {
            id: 'evidence-custody',
            icon: Shield,
            title: 'Evidence Chain of Custody',
            description: 'SHA-256 hashing and integrity verification for forensic evidence',
            status: 'active',
            color: 'text-purple-600'
        },
        {
            id: 'risk-scoring',
            icon: TrendingUp,
            title: 'Intelligent Risk Scoring',
            description: 'Pattern-based risk adjustments (IP reputation, attack combos, time-based)',
            status: 'active',
            color: 'text-orange-600'
        },
        {
            id: 'correlation',
            icon: Link,
            title: 'Alert Correlation',
            description: 'Multi-stage attack detection through pattern matching',
            status: 'planned',
            color: 'text-gray-600'
        },
        {
            id: 'automation',
            icon: Zap,
            title: 'SOAR Automation',
            description: 'Rule-based automated responses to security events',
            status: 'planned',
            color: 'text-gray-600'
        }
    ];

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3"
                    >
                        <Brain className="h-7 w-7 text-primary" />
                        Intelligence Dashboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-muted-foreground mt-1"
                    >
                        Explore AI-powered security enhancements and analytics
                    </motion.p>
                </div>

                {/* Feature Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <Card className="hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <Icon className={`h-5 w-5 ${feature.color}`} />
                                            <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                                                {feature.status === 'active' ? 'Active' : 'Planned'}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base mt-2">{feature.title}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {feature.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feature Demonstrations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Feature Demonstrations</CardTitle>
                        <CardDescription>
                            Interactive examples of intelligent SOC capabilities
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={demoTab} onValueChange={setDemoTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="badges">Badges</TabsTrigger>
                                <TabsTrigger value="integrity">Integrity</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4 mt-4">
                                <div className="rounded-lg border bg-muted/30 p-6">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        System Status
                                    </h3>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                            <span className="text-sm">Source Attribution</span>
                                            <Badge variant="default">✅ Active</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                            <span className="text-sm">Attack Timeline</span>
                                            <Badge variant="default">✅ Active</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                            <span className="text-sm">Evidence Custody</span>
                                            <Badge variant="default">✅ Active</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                            <span className="text-sm">Risk Scoring</span>
                                            <Badge variant="default">✅ Active</Badge>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-4">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Example of attack progression visualization with escalating severity
                                    </p>
                                    <AttackTimeline
                                        incidentId="demo-incident"
                                        alerts={sampleAlerts}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="badges" className="mt-4">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Source badges automatically identify alert origins
                                    </p>
                                    <div className="grid gap-3">
                                        {[
                                            { title: 'Simulated Phishing Attack', source: 'Proofpoint' },
                                            { title: 'Log File Alert', source: 'Log Analysis Engine' },
                                            { title: 'Manual Investigation', source: 'SOC Analyst' }
                                        ].map((demo, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                                <span className="text-sm flex-1">{demo.title}</span>
                                                <SourceBadge
                                                    alert={{ source: demo.source } as any}
                                                    variant="compact"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="integrity" className="mt-4">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Evidence integrity verification with SHA-256 hashing
                                    </p>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-lg border bg-card">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-mono text-sm">Evidence: 192.168.1.100</span>
                                                <IntegrityBadge
                                                    isVerified={true}
                                                    lastVerified={new Date().toISOString()}
                                                    verifying={verifying}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Hash: 8d5e9...f2a3c (SHA-256)
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg border bg-card">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-mono text-sm">Evidence: malware.exe</span>
                                                <IntegrityBadge
                                                    isVerified={false}
                                                    lastVerified={new Date().toISOString()}
                                                    verifying={verifying}
                                                />
                                            </div>
                                            <p className="text-xs text-destructive">
                                                ⚠️ Hash mismatch detected - evidence may be compromised
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
