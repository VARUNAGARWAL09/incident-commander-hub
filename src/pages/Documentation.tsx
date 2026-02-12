import { motion } from 'framer-motion';
import {
  Download,
  Shield,
  AlertTriangle,
  FileText,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
  Eye,
  Server,
  Mail,
  Globe,
  HardDrive,
  Users,
  Clock,
  Target
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { generateDocumentationPDF } from '@/lib/pdfGenerator';

const Documentation = () => {
  const handlePrint = () => {
    // Generate professional PDF instead of using browser print
    generateDocumentationPDF(threatTypes, severityLevels);
  };

  const threatTypes = [
    {
      name: 'Suspicious Login Attempt',
      category: 'Authentication',
      icon: Lock,
      severity: 'high',
      indicators: [
        'Multiple failed login attempts (>5 in 5 minutes)',
        'Login from unusual geographic location',
        'Impossible travel detection (2 locations < 2 hours)',
        'Off-hours access attempts',
        'Unknown user agent or device'
      ],
      response: [
        'Immediately lock the affected account',
        'Verify user identity through secondary channel',
        'Reset credentials if compromise confirmed',
        'Block suspicious source IP addresses',
        'Review access logs for lateral movement'
      ],
      mitre: ['T1078 - Valid Accounts', 'T1110 - Brute Force']
    },
    {
      name: 'Malware Detection',
      category: 'Endpoint',
      icon: HardDrive,
      severity: 'critical',
      indicators: [
        'Known malware hash signature match',
        'Suspicious process behavior patterns',
        'Registry persistence mechanisms detected',
        'Privilege escalation attempts',
        'Memory injection detected'
      ],
      response: [
        'Isolate the affected endpoint immediately',
        'Capture memory dump for forensic analysis',
        'Run full system antivirus scan',
        'Identify and patch the entry vector',
        'Check for lateral movement to other systems'
      ],
      mitre: ['T1204 - User Execution', 'T1547 - Boot or Logon Autostart']
    },
    {
      name: 'Data Exfiltration',
      category: 'Network',
      icon: Globe,
      severity: 'high',
      indicators: [
        'Large data transfer to external destination (>100MB)',
        'Connection to low-reputation IP addresses',
        'Unusual upload to cloud storage services',
        'Data transfer outside business hours',
        'Encrypted traffic to unknown endpoints'
      ],
      response: [
        'Block the outbound connection immediately',
        'Identify the source user/system',
        'Assess what data may have been exfiltrated',
        'Review DLP policy effectiveness',
        'Notify legal/compliance if sensitive data involved'
      ],
      mitre: ['T1041 - Exfiltration Over C2 Channel', 'T1567 - Exfiltration Over Web Service']
    },
    {
      name: 'Phishing Email',
      category: 'Email',
      icon: Mail,
      severity: 'medium',
      indicators: [
        'SPF/DKIM authentication failure',
        'Newly registered sender domain (<30 days)',
        'Suspicious links or attachments',
        'Urgency language patterns',
        'Spoofed executive/vendor sender'
      ],
      response: [
        'Quarantine the email immediately',
        'Notify all recipients not to interact',
        'Block sender domain at email gateway',
        'Check if any user clicked links',
        'Reset credentials for affected users'
      ],
      mitre: ['T1566 - Phishing', 'T1598 - Phishing for Information']
    },
    {
      name: 'Brute Force Attack',
      category: 'Network',
      icon: Target,
      severity: 'medium',
      indicators: [
        'High volume of failed authentication (>50/min)',
        'Sequential or dictionary-based attempts',
        'Multiple target accounts from single source',
        'Attacks on exposed services (SSH, RDP, FTP)',
        'Low-reputation source IP'
      ],
      response: [
        'Block attacking IP at firewall',
        'Enable account lockout policies',
        'Implement rate limiting',
        'Review exposed service configuration',
        'Consider implementing MFA'
      ],
      mitre: ['T1110 - Brute Force', 'T1046 - Network Service Discovery']
    },
    {
      name: 'Ransomware Activity',
      category: 'Endpoint',
      icon: AlertTriangle,
      severity: 'critical',
      indicators: [
        'Mass file encryption detected (>50 files/min)',
        'Ransom note file creation',
        'Shadow copy deletion attempts',
        'Known ransomware process signatures',
        'Unusual file extension changes'
      ],
      response: [
        'IMMEDIATELY isolate affected systems',
        'Do NOT pay the ransom',
        'Activate incident response team',
        'Preserve evidence for forensics',
        'Begin restoration from clean backups',
        'Notify law enforcement if required'
      ],
      mitre: ['T1486 - Data Encrypted for Impact', 'T1490 - Inhibit System Recovery']
    },
    {
      name: 'Unauthorized Access',
      category: 'Access Control',
      icon: Eye,
      severity: 'high',
      indicators: [
        'Access to resources beyond user permissions',
        'Privilege escalation detected',
        'Access from non-whitelisted IP/location',
        'Unusual data access patterns',
        'Service account misuse'
      ],
      response: [
        'Revoke user access immediately',
        'Review what resources were accessed',
        'Check for data exfiltration',
        'Audit access control policies',
        'Interview the user if internal'
      ],
      mitre: ['T1548 - Abuse Elevation Control', 'T1078 - Valid Accounts']
    },
    {
      name: 'Cryptominer Detected',
      category: 'Endpoint',
      icon: Zap,
      severity: 'medium',
      indicators: [
        'High CPU/GPU usage (>60% sustained)',
        'Connections to mining pool servers',
        'Known miner process names',
        'Unusual network traffic patterns',
        'Registry/startup persistence'
      ],
      response: [
        'Terminate the mining process',
        'Identify how miner was installed',
        'Scan for additional compromises',
        'Patch the vulnerability exploited',
        'Review endpoint security controls'
      ],
      mitre: ['T1496 - Resource Hijacking', 'T1059 - Command and Scripting']
    }
  ];

  const severityLevels = [
    {
      level: 'Critical',
      score: '70-100',
      color: 'bg-severity-critical',
      description: 'Immediate threat requiring urgent response. Auto-escalates to incident.',
      sla: '15 minutes',
      actions: ['Immediate isolation', 'Activate IR team', 'Executive notification']
    },
    {
      level: 'High',
      score: '50-69',
      color: 'bg-severity-high',
      description: 'Significant threat requiring prompt investigation.',
      sla: '1 hour',
      actions: ['Priority investigation', 'Containment measures', 'Manager notification']
    },
    {
      level: 'Medium',
      score: '30-49',
      color: 'bg-severity-medium',
      description: 'Potential threat requiring analysis and monitoring.',
      sla: '4 hours',
      actions: ['Scheduled analysis', 'Monitor for escalation', 'Document findings']
    },
    {
      level: 'Low',
      score: '10-29',
      color: 'bg-severity-low',
      description: 'Minor anomaly, monitor and document.',
      sla: '24 hours',
      actions: ['Queue for review', 'Update baselines', 'Training opportunity']
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-8 print:space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-2xl font-bold tracking-tight flex items-center gap-2"
            >
              <FileText className="h-6 w-6 text-primary" />
              Security Documentation
            </motion.h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive guide to threat detection and incident response
            </p>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold">Security Operations Center</h1>
          <h2 className="text-xl text-gray-600 mt-2">Threat Detection & Response Guide</h2>
          <p className="text-sm text-gray-500 mt-4">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* System Overview */}
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The Incident Response Platform is a comprehensive Security Operations Center (SOC)
              solution that provides real-time threat detection, automated analysis, and incident
              management capabilities. The system uses advanced detection logic to analyze security
              events from multiple sources and automatically classify threats based on risk scoring.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Server className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold">Real-Time Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Continuous monitoring with 15+ threat indicators analyzed per event
                </p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Zap className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold">Auto-Escalation</h4>
                <p className="text-sm text-muted-foreground">
                  Critical alerts automatically escalate to incidents for immediate response
                </p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-semibold">Team Coordination</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time collaboration with assignment, status tracking, and audit trails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Platform Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Management */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Management
              </h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive team management interface for SOC operations with professional UI and real-time collaboration features.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">View Modes</h4>
                  <p className="text-xs text-muted-foreground">
                    Toggle between grid and list views for optimal team visualization
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Live Status</h4>
                  <p className="text-xs text-muted-foreground">
                    Real-time online/offline status and last activity tracking
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Role Management</h4>
                  <p className="text-xs text-muted-foreground">
                    Assign and manage roles (Admin, Analyst, Viewer) with access control
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Team Analytics</h4>
                  <p className="text-xs text-muted-foreground">
                    View team statistics including online members and active assignments
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* AI Assistant Chatbot */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                IRIS AI Assistant
              </h3>
              <p className="text-sm text-muted-foreground">
                Intelligent conversational assistant providing real-time SOC operational insights and data access.
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Capabilities:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Incident Lookup:</strong> Query specific incidents by case number (e.g., "Show INC-001")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Search & Filter:</strong> Find incidents by keywords, severity, or status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Alert Monitoring:</strong> View pending and recent security alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>System Status:</strong> Check platform health and operational metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Team Information:</strong> Query team member availability and assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Quick Summaries:</strong> Get dashboard overviews and statistical insights</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-3">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Example Queries
                </h4>
                <div className="grid gap-2 text-xs font-mono">
                  <div className="bg-background/50 px-3 py-2 rounded">
                    "Show INC-001" → Displays full incident details
                  </div>
                  <div className="bg-background/50 px-3 py-2 rounded">
                    "Critical incidents" → Lists all critical priority cases
                  </div>
                  <div className="bg-background/50 px-3 py-2 rounded">
                    "Recent alerts" → Shows latest security detections
                  </div>
                  <div className="bg-background/50 px-3 py-2 rounded">
                    "System status" → Platform health report
                  </div>
                  <div className="bg-background/50 px-3 py-2 rounded">
                    "Summary" → Complete SOC dashboard overview
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Access IRIS by clicking the floating bot icon in the bottom-right corner of any page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Severity Classification */}
        <Card className="print:shadow-none print:border-gray-300 print:break-before-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Severity Classification & SLAs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {severityLevels.map((level) => (
                <div key={level.level} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${level.color}`} />
                    <h4 className="font-semibold">{level.level}</h4>
                    <Badge variant="outline" className="font-mono">
                      Score: {level.score}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      SLA: {level.sla}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{level.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {level.actions.map((action, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-secondary rounded">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Threat Types */}
        <div className="space-y-6 print:break-before-page">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Threat Detection Categories
          </h2>

          {threatTypes.map((threat, index) => (
            <Card key={threat.name} className="print:shadow-none print:border-gray-300 print:break-inside-avoid">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <threat.icon className="h-5 w-5 text-primary" />
                    {threat.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{threat.category}</Badge>
                    <Badge
                      className={
                        threat.severity === 'critical' ? 'bg-severity-critical' :
                          threat.severity === 'high' ? 'bg-severity-high' :
                            'bg-severity-medium'
                      }
                    >
                      {threat.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Detection Indicators
                  </h5>
                  <ul className="space-y-1">
                    {threat.indicators.map((indicator, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Response Procedures
                  </h5>
                  <ol className="space-y-1">
                    {threat.response.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="font-mono text-primary font-semibold">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-2">
                  <h5 className="font-semibold text-sm mb-2">MITRE ATT&CK Mapping</h5>
                  <div className="flex flex-wrap gap-2">
                    {threat.mitre.map((tech, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Risk Scoring Methodology */}
        <Card className="print:shadow-none print:border-gray-300 print:break-before-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Risk Scoring Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The system calculates risk scores (0-100) based on weighted analysis of multiple
              threat indicators. Each indicator contributes to the total score based on its
              severity and reliability.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Indicator Category</th>
                    <th className="text-left py-2 font-semibold">Indicators</th>
                    <th className="text-left py-2 font-semibold">Max Score Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2">Network Anomalies</td>
                    <td className="py-2 text-muted-foreground">Data transfer, port scanning, IP reputation</td>
                    <td className="py-2 font-mono">+35 points</td>
                  </tr>
                  <tr>
                    <td className="py-2">Authentication Events</td>
                    <td className="py-2 text-muted-foreground">Failed logins, impossible travel, off-hours</td>
                    <td className="py-2 font-mono">+40 points</td>
                  </tr>
                  <tr>
                    <td className="py-2">Endpoint Behavior</td>
                    <td className="py-2 text-muted-foreground">File encryption, privilege escalation, persistence</td>
                    <td className="py-2 font-mono">+50 points</td>
                  </tr>
                  <tr>
                    <td className="py-2">Threat Intelligence</td>
                    <td className="py-2 text-muted-foreground">Hash matches, domain age, IP reputation</td>
                    <td className="py-2 font-mono">+50 points</td>
                  </tr>
                  <tr>
                    <td className="py-2">Email Security</td>
                    <td className="py-2 text-muted-foreground">SPF/DKIM, suspicious links, sender reputation</td>
                    <td className="py-2 font-mono">+25 points</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Note: Maximum cumulative score is capped at 100. Multiple indicators from the
              same category may have diminishing returns to prevent over-weighting.
            </p>
          </CardContent>
        </Card>

        {/* Contact & Escalation */}
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Escalation Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Tier 1 - SOC Analysts</h4>
                <p className="text-sm text-muted-foreground">Initial triage and investigation</p>
                <p className="text-sm font-mono mt-2">soc-team@company.com</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Tier 2 - Security Engineers</h4>
                <p className="text-sm text-muted-foreground">Advanced investigation and containment</p>
                <p className="text-sm font-mono mt-2">security-engineers@company.com</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Tier 3 - Incident Response</h4>
                <p className="text-sm text-muted-foreground">Critical incidents and forensics</p>
                <p className="text-sm font-mono mt-2">ir-team@company.com</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Management</h4>
                <p className="text-sm text-muted-foreground">Executive notification for critical events</p>
                <p className="text-sm font-mono mt-2">ciso@company.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8 print:py-4">
          <Separator className="mb-4" />
          <p>Incident Response Platform - Security Documentation</p>
          <p className="mt-1">Version 1.0 | Last Updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-1 italic">This document is confidential and intended for internal use only.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Documentation;
