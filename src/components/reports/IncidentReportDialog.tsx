import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Incident } from '@/context/IncidentsContext';

interface IncidentReportDialogProps {
  incident: Incident;
  trigger?: React.ReactNode;
}

interface ReportOptions {
  includeDescription: boolean;
  includeTimeline: boolean;
  includeEvidence: boolean;
  includeAlerts: boolean;
  includeRecommendations: boolean;
}

export const IncidentReportDialog = ({ incident, trigger }: IncidentReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    includeDescription: true,
    includeTimeline: true,
    includeEvidence: true,
    includeAlerts: true,
    includeRecommendations: true,
  });
  const { toast } = useToast();

  const generateReport = async () => {
    setGenerating(true);
    console.log('📄 Starting PDF generation for:', incident.case_number);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      console.log('✅ PDF document initialized');

      // ===== COVER PAGE =====
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('IRIS.SEC', pageWidth / 2, 80, { align: 'center' });

      doc.setFontSize(24);
      doc.text('INCIDENT RESPONSE REPORT', pageWidth / 2, 100, { align: 'center' });

      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.text(incident.case_number, pageWidth / 2, 120, { align: 'center' });

      // Classification banner
      doc.setFillColor(239, 68, 68);
      doc.rect(0, pageHeight - 60, pageWidth, 20, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIDENTIAL - INTERNAL USE ONLY', pageWidth / 2, pageHeight - 47, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
      doc.text(`Incident Date: ${format(new Date(incident.created_at), 'PPpp')}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

      // ===== PAGE 2: EXECUTIVE SUMMARY =====
      doc.addPage();
      yPos = 20;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const execSummary = `This report provides a comprehensive analysis of security incident ${incident.case_number}, "${incident.title}". The incident was classified as ${incident.severity.toUpperCase()} severity and is currently in ${incident.status.toUpperCase()} status. This document details the incident timeline, technical analysis, impact assessment, response actions, and recommendations for preventing similar incidents in the future.`;
      const execLines = doc.splitTextToSize(execSummary, pageWidth - 28);
      doc.text(execLines, 14, yPos);
      yPos += execLines.length * 5 + 15;

      // Incident at a Glance Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, yPos - 5, pageWidth - 28, 70, 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(14, yPos - 5, pageWidth - 28, 70, 3, 3, 'S');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INCIDENT AT A GLANCE', 20, yPos + 5);
      yPos += 15;

      const severityColors: Record<string, [number, number, number]> = {
        critical: [239, 68, 68],
        high: [249, 115, 22],
        medium: [234, 179, 8],
        low: [34, 197, 94],
        info: [59, 130, 246],
      };

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Incident ID:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(incident.case_number, 60, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Title:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      const titleLines = doc.splitTextToSize(incident.title, pageWidth - 80);
      doc.text(titleLines, 60, yPos);
      yPos += titleLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Severity:', 20, yPos);
      const sevColor = severityColors[incident.severity] || [107, 114, 128];
      doc.setFillColor(...sevColor);
      doc.roundedRect(60, yPos - 4, 40, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(incident.severity.toUpperCase(), 65, yPos);
      doc.setTextColor(0, 0, 0);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(incident.status.toUpperCase(), 60, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('First Detected:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(incident.created_at), 'PPpp'), 60, yPos);

      if (incident.closed_at) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Resolved:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(format(new Date(incident.closed_at), 'PPpp'), 60, yPos);

        const duration = new Date(incident.closed_at).getTime() - new Date(incident.created_at).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Resolution Time:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${hours}h ${minutes}m`, 60, yPos);
      }

      yPos += 20;

      // ===== INCIDENT DESCRIPTION =====
      if (options.includeDescription && incident.description) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INCIDENT DESCRIPTION', 14, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(incident.description, pageWidth - 28);
        doc.text(descLines, 14, yPos);
        yPos += descLines.length * 5 + 15;
        console.log('✅ Description section complete');
      }

      // ===== INDICATORS OF COMPROMISE (IOCs) =====
      console.log('🔍 Fetching evidence data for IOCs...');
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('incident_id', incident.id);

      if (evidenceError) {
        console.error('❌ Error fetching evidence:', evidenceError);
      } else {
        console.log(`✅ Found ${evidence?.length || 0} evidence items`);
      }

      if (options.includeEvidence && evidence && evidence.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INDICATORS OF COMPROMISE (IOCs)', 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('The following artifacts were identified and collected during the investigation:', 14, yPos);
        yPos += 10;

        autoTable(doc, {
          startY: yPos,
          head: [['Type', 'Value', 'Classification', 'Source', 'Collected']],
          body: evidence.map(e => [
            e.type.toUpperCase(),
            e.value.length > 35 ? e.value.substring(0, 35) + '...' : e.value,
            e.classification.toUpperCase(),
            'Log Investigation',
            format(new Date(e.created_at), 'PPp'),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [17, 24, 39], fontSize: 9, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 14, right: 14 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
        console.log('✅ IOCs section complete');
      }

      // ===== RELATED ALERTS =====
      console.log('🔍 Fetching alerts data...');
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('incident_id', incident.id);

      if (alertsError) {
        console.error('❌ Error fetching alerts:', alertsError);
      } else {
        console.log(`✅ Found ${alerts?.length || 0} alerts`);
      }

      if (options.includeAlerts && alerts && alerts.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('SECURITY ALERTS', 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('The following security alerts were correlated with this incident:', 14, yPos);
        yPos += 10;

        autoTable(doc, {
          startY: yPos,
          head: [['Alert Title', 'Source', 'Severity', 'Status', 'Timestamp']],
          body: alerts.map(a => [
            a.title.length > 40 ? a.title.substring(0, 40) + '...' : a.title,
            a.source.length > 20 ? a.source.substring(0, 20) + '...' : a.source,
            a.severity.toUpperCase(),
            a.status.toUpperCase(),
            format(new Date(a.created_at), 'PPp'),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [17, 24, 39], fontSize: 9, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 14, right: 14 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
        console.log('✅ Alerts section complete');
      }

      // ===== ATTACK TIMELINE =====
      if (options.includeTimeline) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INCIDENT TIMELINE', 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Chronological sequence of events and response actions:', 14, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'normal');

        const timelineEvents = [
          { event: 'Incident First Detected', date: incident.created_at, type: 'detection' },
          { event: 'Investigation Initiated', date: incident.created_at, type: 'response' },
          ...(alerts?.map(a => ({
            event: `Alert: ${a.title.substring(0, 50)}`,
            date: a.created_at,
            type: 'alert'
          })) || []),
          ...(incident.closed_at ? [{
            event: 'Incident Resolved and Closed',
            date: incident.closed_at,
            type: 'resolution'
          }] : [{
            event: 'Investigation Ongoing',
            date: new Date().toISOString(),
            type: 'ongoing'
          }]),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        timelineEvents.forEach(item => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          // Timeline dot color based on type
          const dotColors: Record<string, [number, number, number]> = {
            detection: [239, 68, 68],
            alert: [249, 115, 22],
            response: [59, 130, 246],
            resolution: [34, 197, 94],
            ongoing: [234, 179, 8],
          };
          const color = dotColors[item.type] || [107, 114, 128];

          doc.setFillColor(...color);
          doc.circle(18, yPos - 1.5, 2.5, 'F');

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(format(new Date(item.date), 'PPpp'), 24, yPos);

          doc.setFont('helvetica', 'normal');
          const eventLines = doc.splitTextToSize(item.event, pageWidth - 38);
          doc.text(eventLines, 24, yPos + 5);

          yPos += 5 + (eventLines.length * 5) + 3;
        });

        yPos += 10;
        console.log('✅ Timeline section complete');
      }

      // ===== IMPACT ASSESSMENT =====
      if (yPos > 210) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('IMPACT ASSESSMENT', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const impactLevels = {
        critical: 'Severe impact on business operations. Immediate action required.',
        high: 'Significant impact on security posture. High priority remediation needed.',
        medium: 'Moderate impact. Should be addressed in a timely manner.',
        low: 'Minor impact. Can be addressed through routine processes.',
        info: 'Informational. No immediate impact to operations.',
      };

      const scopeAnalysis = `Based on the ${incident.severity} severity classification, this incident has been assessed as follows:\n\n${impactLevels[incident.severity]}\n\nAffected systems and data are being cataloged through evidence collection. ${evidence?.length || 0} artifacts have been preserved for forensic analysis.`;
      const scopeLines = doc.splitTextToSize(scopeAnalysis, pageWidth - 28);
      doc.text(scopeLines, 14, yPos);
      yPos += scopeLines.length * 5 + 15;

      // ===== ROOT CAUSE ANALYSIS =====
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ROOT CAUSE ANALYSIS', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const rootCause = `The root cause analysis is ${incident.status === 'closed' || incident.status === 'resolved' ? 'complete' : 'ongoing'}. Preliminary findings indicate the incident was ${incident.severity} severity, requiring ${incident.status === 'closed' ? 'full containment and remediation' : 'continued investigation and response'}. Tags associated with this incident include: ${incident.tags?.join(', ') || 'None'}.`;
      const rootLines = doc.splitTextToSize(rootCause, pageWidth - 28);
      doc.text(rootLines, 14, yPos);
      yPos += rootLines.length * 5 + 15;

      // ===== RESPONSE ACTIONS =====
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESPONSE ACTIONS TAKEN', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const responseActions = [
        `Incident ${incident.case_number} was detected and logged in the IR system`,
        `Severity classified as ${incident.severity.toUpperCase()} based on initial triage`,
        `${alerts?.length || 0} security alert(s) were correlated and investigated`,
        `${evidence?.length || 0} indicator(s) of compromise were identified and preserved`,
        `Evidence collected includes: ${evidence?.map(e => e.type).join(', ') || 'pending collection'}`,
        incident.status === 'contained' || incident.status === 'resolved' || incident.status === 'closed'
          ? 'Threat has been contained and systems are being restored'
          : 'Active investigation and containment efforts are underway',
      ];

      responseActions.forEach((action, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${action}`, 14, yPos);
        yPos += 6;
      });

      yPos += 10;

      // ===== RECOMMENDATIONS =====
      if (options.includeRecommendations) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMMENDATIONS', 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('The following recommendations are provided to prevent similar incidents:', 14, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'normal');

        const recommendations = getRecommendations(incident);
        recommendations.forEach((rec, index) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 28);
          doc.text(lines, 14, yPos);
          yPos += lines.length * 5 + 4;
        });

        console.log('✅ Recommendations section complete');
      }

      // ===== APPENDIX: TECHNICAL DETAILS =====
      doc.addPage();
      yPos = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('APPENDIX: TECHNICAL DETAILS', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Metadata', 14, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Report Generated: ${format(new Date(), 'PPpp')}`, 14, yPos);
      yPos += 5;
      doc.text(`Generated By: IRIS.SEC Automated Reporting System`, 14, yPos);
      yPos += 5;
      doc.text(`Incident ID: ${incident.case_number}`, 14, yPos);
      yPos += 5;
      doc.text(`Report Classification: CONFIDENTIAL - INTERNAL USE ONLY`, 14, yPos);
      yPos += 5;
      doc.text(`Pages: ${doc.getNumberOfPages()}`, 14, yPos);

      console.log('✅ Footer complete');

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);
        doc.setFont('helvetica', 'normal');
        doc.text('IRIS.SEC Incident Response', 14, pageHeight - 10);
        doc.text(incident.case_number, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        doc.setFontSize(6);
        doc.text('CONFIDENTIAL', pageWidth - 14, pageHeight - 6, { align: 'right' });
      }

      // Save the PDF
      console.log('💾 Saving PDF...');
      doc.save(`${incident.case_number}-Detailed-Report.pdf`);

      console.log('✅ PDF generation complete!');

      toast({
        title: 'Detailed Report Generated',
        description: `${incident.case_number} comprehensive security report has been downloaded.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Could not generate the incident report.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getRecommendations = (incident: Incident): string[] => {
    const recs: string[] = [];

    // Severity-based recommendations
    if (incident.severity === 'critical' || incident.severity === 'high') {
      recs.push('Conduct comprehensive post-incident review with all stakeholders to identify root causes and systemic vulnerabilities.');
      recs.push('Update detection rules and SIEM correlation logic based on attack patterns and IOCs identified during investigation.');
      recs.push('Implement enhanced monitoring for similar attack vectors across the enterprise environment.');
      recs.push('Review and update incident response playbooks to incorporate lessons learned from this incident.');
      recs.push('Conduct tabletop exercises to validate improved response procedures.');
    }

    // Status-based recommendations
    if (incident.status === 'open' || incident.status === 'investigating') {
      recs.push('Prioritize immediate containment activities to prevent lateral movement and limit blast radius.');
      recs.push('Maintain detailed chain of custody for all digital evidence collected during investigation.');
      recs.push('Establish clear communication channels with stakeholders and provide regular status updates.');
      recs.push('Consider engaging external incident response consultants if additional expertise is required.');
    }

    if (incident.status === 'contained' || incident.status === 'resolved') {
      recs.push('Verify complete eradication of threat actors and persistence mechanisms from affected systems.');
      recs.push('Conduct thorough validation testing before restoring systems to production environment.');
      recs.push('Implement compensating controls to address identified security gaps during recovery phase.');
    }

    // General security posture recommendations
    recs.push('Ensure all affected systems are patched to latest security updates and hardened against similar attacks.');
    recs.push('Review and enhance access controls, implementing principle of least privilege across all systems.');
    recs.push('Update security awareness training to include attack techniques observed in this incident.');
    recs.push('Coordinate with threat intelligence teams to share IOCs and TTPs with information sharing communities.');
    recs.push('Document all findings, actions taken, and recommendations in centralized knowledge base for future reference.');
    recs.push('Schedule follow-up review in 30 days to verify implementation of remediation measures.');

    return recs;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Incident Report
          </DialogTitle>
          <DialogDescription>
            Create a PDF report for {incident.case_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium">{incident.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {incident.severity.toUpperCase()} • {incident.status.toUpperCase()}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Report</Label>

            <div className="space-y-2">
              {[
                { key: 'includeDescription', label: 'Description' },
                { key: 'includeTimeline', label: 'Timeline' },
                { key: 'includeEvidence', label: 'Evidence Items' },
                { key: 'includeAlerts', label: 'Related Alerts' },
                { key: 'includeRecommendations', label: 'Recommendations' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <Checkbox
                    id={item.key}
                    checked={options[item.key as keyof ReportOptions]}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, [item.key]: checked }))
                    }
                  />
                  <Label htmlFor={item.key} className="text-sm cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={generateReport} disabled={generating} className="gap-2">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
