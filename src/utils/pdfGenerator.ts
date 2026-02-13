
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Incident } from '@/context/IncidentsContext';
import { IncidentReport } from '@/types/incidentReport';
import { Evidence, Alert } from '@/context/SimulationContext';

export const generateIncidentReportPDF = (
    incident: Incident,
    report: IncidentReport | null,
    evidenceList: Evidence[],
    alertList: Alert[]
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

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
    doc.text(`Severity: ${incident.severity.toUpperCase()}`, pageWidth / 2, 130, { align: 'center' });

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

    if (report?.created_by) {
        doc.text(`Analyst: ${report.created_by}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // ===== PAGE 2: EXECUTIVE SUMMARY =====
    doc.addPage();
    yPos = 20;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 14, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const summaryText = report?.executive_summary?.summary || incident.description || 'No summary provided.';
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 28);
    doc.text(splitSummary, 14, yPos);
    yPos += splitSummary.length * 7 + 10;

    if (report?.executive_summary?.timeline_summary) {
        doc.setFont('helvetica', 'bold');
        doc.text('Timeline Summary:', 14, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const timelineText = doc.splitTextToSize(report.executive_summary.timeline_summary, pageWidth - 28);
        doc.text(timelineText, 14, yPos);
        yPos += timelineText.length * 7 + 10;
    }

    // ===== TECHNICAL ANALYSIS =====
    yPos += 10;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICAL ANALYSIS', 14, yPos);
    yPos += 15;

    doc.setFontSize(12);
    if (report?.technical_analysis) {
        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Details']],
            body: [
                ['Attack Vector', report.technical_analysis.attack_vector || 'N/A'],
                ['MITRE Techniques', report.technical_analysis.mitre_techniques?.join(', ') || 'None'],
                ['IOCs', report.technical_analysis.iocs?.join(', ') || 'None'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [17, 24, 39] },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    }

    // ===== EVIDENCE =====
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EVIDENCE SUMMARY', 14, yPos);
    yPos += 10;

    if (evidenceList.length > 0) {
        const evidenceData = evidenceList.map(e => [
            e.type,
            e.value.substring(0, 40) + (e.value.length > 40 ? '...' : ''),
            e.classification,
            format(new Date(e.created_at), 'MMM dd HH:mm')
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Type', 'Value', 'Class', 'Time']],
            body: evidenceData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('No evidence linked to this incident.', 14, yPos);
        yPos += 20;
    }

    // ===== ROOT CAUSE & IMPACT =====
    if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOT CAUSE & IMPACT', 14, yPos);
    yPos += 15;

    if (report?.root_cause) {
        doc.setFontSize(14);
        doc.text(`Root Cause: ${report.root_cause.type}`, 14, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(report.root_cause.description || '', 14, yPos);
        yPos += 15;
    }

    if (report?.business_impact) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Business Impact:', 14, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Risk Level: ${report.business_impact.risk_level}`, 14, yPos);
        yPos += 6;
        doc.text(`Affected Systems: ${report.business_impact.affected_systems?.join(', ')}`, 14, yPos);
        yPos += 6;
        doc.text(`Downtime: ${report.business_impact.downtime_duration}`, 14, yPos);
        yPos += 15;
    }

    // ===== COMPLIANCE =====
    if (report?.compliance_mapping) {
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPLIANCE MAPPING', 14, yPos);
        yPos += 15;

        const complianceData = [];
        if (report.compliance_mapping.nist_detect) complianceData.push(['NIST', 'DETECT', 'Implemented']);
        if (report.compliance_mapping.nist_respond) complianceData.push(['NIST', 'RESPOND', 'Implemented']);
        if (report.compliance_mapping.nist_recover) complianceData.push(['NIST', 'RECOVER', 'Implemented']);

        report.compliance_mapping.iso_controls?.forEach(c => {
            complianceData.push(['ISO 27001', c, 'Triggered']);
        });

        if (complianceData.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Framework', 'Control', 'Status']],
                body: complianceData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
            });
            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
        } else {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.text('No compliance controls mapped.', 14, yPos);
            yPos += 15;
        }
    }

    // ===== SIGNATURES =====
    doc.addPage();
    yPos = 40;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('APPROVAL', 14, yPos);
    yPos += 30;

    doc.setLineWidth(0.5);
    doc.line(14, yPos, 80, yPos); // Line 1
    doc.line(110, yPos, 180, yPos); // Line 2
    yPos += 10;

    doc.setFontSize(10);
    doc.text('Report Created By', 14, yPos);
    doc.text('Approved By', 110, yPos);
    yPos += 5;

    if (report?.created_by) {
        doc.setFontSize(12);
        doc.text(report.created_by, 14, yPos - 15); // Above line
    }

    if (report?.approved_by) {
        doc.setFontSize(12);
        doc.text(report.approved_by, 110, yPos - 15); // Above line
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        doc.text(`IRIS-SOC Incident Report: ${incident.case_number}`, 14, pageHeight - 10);
    }

    doc.save(`${incident.case_number}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
