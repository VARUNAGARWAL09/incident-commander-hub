import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useIncidents } from '@/context/IncidentsContext';
import {
    Shield,
    FileCheck2,
    Clock,
    TrendingUp,
    Download,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    BarChart3,
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    getNistAlignment,
    getIsoControls,
    calculateSlaMetrics,
    calculateResolutionMetrics,
    calculateTrendData,
    formatMinutes,
} from '@/lib/complianceService';
import { generateCompliancePDF } from '@/lib/compliancePDFGenerator';
import { toast } from 'sonner';

const COLORS = {
    primary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    muted: '#64748b',
};

export default function Compliance() {
    const { incidents } = useIncidents();

    // Calculate all metrics (memoized for performance)
    const nistFunctions = useMemo(
        () => getNistAlignment(true, incidents.length > 0, true, true),
        [incidents]
    );

    const isoControls = useMemo(
        () => getIsoControls(incidents.length > 0, true, true),
        [incidents]
    );

    const slaMetrics = useMemo(() => calculateSlaMetrics(incidents), [incidents]);

    const resolutionMetrics = useMemo(() => calculateResolutionMetrics(incidents), [incidents]);

    const trendData = useMemo(() => calculateTrendData(incidents, 7), [incidents]);

    // SLA Pie Chart Data
    const slaPieData = [
        { name: 'Within SLA', value: slaMetrics.withinSla, color: COLORS.primary },
        { name: 'Breached SLA', value: slaMetrics.breachedSla, color: COLORS.danger },
    ];

    // Handle PDF Export
    const handleExportPDF = () => {
        try {
            generateCompliancePDF({
                nistFunctions,
                isoControls,
                slaMetrics,
                resolutionMetrics,
                trendData,
            });
            toast.success('Compliance report exported successfully');
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('Failed to export report');
        }
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
            Implemented: { variant: 'default', icon: CheckCircle2 },
            Partial: { variant: 'secondary', icon: AlertTriangle },
            'Not Covered': { variant: 'destructive', icon: XCircle },
        };
        const config = variants[status] || variants.Partial;
        const Icon = config.icon;
        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        );
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="h-8 w-8 text-primary" />
                            Compliance & Reporting
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Governance-level insights and regulatory compliance monitoring
                        </p>
                    </div>
                    <Button onClick={handleExportPDF} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>

                {/* No Data Warning */}
                {incidents.length === 0 && (
                    <Card className="border-warning bg-warning/5">
                        <CardContent className="py-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-warning" />
                                <div>
                                    <p className="font-semibold">No Incident Data Available</p>
                                    <p className="text-sm text-muted-foreground">
                                        Some metrics will show as 0 until incidents are created
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                SLA Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">
                                {slaMetrics.compliancePercentage}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {slaMetrics.withinSla} of {slaMetrics.withinSla + slaMetrics.breachedSla} incidents
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Resolution Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{resolutionMetrics.resolutionRate}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {resolutionMetrics.closedIncidents} of {resolutionMetrics.totalIncidents} resolved
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                MTTR
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{slaMetrics.mttr}</div>
                            <p className="text-xs text-muted-foreground mt-1">Mean Time to Resolve</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Open Incidents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{resolutionMetrics.openIncidents}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active cases</p>
                        </CardContent>
                    </Card>
                </div>

                {/* NIST CSF Alignment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck2 className="h-5 w-5 text-primary" />
                            NIST Cybersecurity Framework Alignment
                        </CardTitle>
                        <CardDescription>
                            Coverage mapping to NIST CSF core functions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            {nistFunctions.map((func) => (
                                <Card key={func.id} className="border-muted">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{func.name}</CardTitle>
                                        <CardDescription className="text-xs line-clamp-2">
                                            {func.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Coverage</span>
                                                <span className="text-sm font-bold text-primary">{func.coverage}%</span>
                                            </div>
                                            <Progress value={func.coverage} className="h-2" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold mb-1">Mapped Features:</p>
                                            <ul className="text-xs text-muted-foreground space-y-1">
                                                {func.mappedFeatures.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ISO 27001 Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            ISO 27001 Control Mapping
                        </CardTitle>
                        <CardDescription>
                            Implementation status of key information security controls
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {isoControls.map((control) => (
                                <div
                                    key={control.id}
                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant="outline" className="font-mono">
                                                {control.id}
                                            </Badge>
                                            <h4 className="font-semibold">{control.name}</h4>
                                            {getStatusBadge(control.status)}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">{control.description}</p>
                                        <p className="text-xs text-primary">
                                            <strong>System Feature:</strong> {control.mappedFeature}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* SLA Compliance & Resolution Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SLA Compliance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                SLA Compliance
                            </CardTitle>
                            <CardDescription>
                                Service Level Agreement adherence metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {slaMetrics.totalIncidents > 0 ? (
                                <div className="space-y-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={slaPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {slaPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Within SLA</p>
                                            <p className="text-2xl font-bold text-primary">{slaMetrics.withinSla}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Breached</p>
                                            <p className="text-2xl font-bold text-destructive">{slaMetrics.breachedSla}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No SLA data available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resolution Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Resolution Metrics
                            </CardTitle>
                            <CardDescription>
                                Average response and resolution times
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Avg Response</p>
                                        <p className="text-xl font-bold">
                                            {formatMinutes(resolutionMetrics.averageResponseMinutes)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Avg Containment</p>
                                        <p className="text-xl font-bold">
                                            {formatMinutes(resolutionMetrics.averageContainmentMinutes)}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Avg Resolution</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {formatMinutes(resolutionMetrics.averageResolutionMinutes)}
                                    </p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-semibold">{resolutionMetrics.totalIncidents}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Closed</p>
                                        <p className="font-semibold text-primary">
                                            {resolutionMetrics.closedIncidents}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Open</p>
                                        <p className="font-semibold text-warning">{resolutionMetrics.openIncidents}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Incident Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            7-Day Incident Trend
                        </CardTitle>
                        <CardDescription>
                            Incident creation and resolution over the past week
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="incidents"
                                        stroke={COLORS.warning}
                                        strokeWidth={2}
                                        name="Created"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="resolved"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        name="Resolved"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No trend data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
