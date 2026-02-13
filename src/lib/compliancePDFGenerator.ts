/**
 * Compliance PDF Generator
 * 
 * Extends existing PDF generation system for compliance reports
 * Reuses styling from pdfGenerator.ts
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    NistFunction,
    IsoControl,
    SlaMetrics,
    ResolutionMetrics,
    TrendDataPoint,
    formatMinutes,
} from './complianceService';

type RGBColor = [number, number, number];

interface CompliancePDFData {
    nistFunctions: NistFunction[];
    isoControls: IsoControl[];
    slaMetrics: SlaMetrics;
    resolutionMetrics: ResolutionMetrics;
    trendData: TrendDataPoint[];
}

export const generateCompliancePDF = (data: CompliancePDFData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const primaryColor: RGBColor = [16, 185, 129];
    const darkColor: RGBColor = [15, 23, 42];
    const mutedColor: RGBColor = [100, 116, 139];
    const whiteColor: RGBColor = [255, 255, 255];
    const warningColor: RGBColor = [245, 158, 11];
    const dangerColor: RGBColor = [239, 68, 68];

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    const setFillRGB = (color: RGBColor) => doc.setFillColor(color[0], color[1], color[2]);
    const setTextRGB = (color: RGBColor) => doc.setTextColor(color[0], color[1], color[2]);
    const setDrawRGB = (color: RGBColor) => doc.setDrawColor(color[0], color[1], color[2]);

    const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            return true;
        }
        return false;
    };

    const addFooter = (pageNum: number) => {
        doc.setFontSize(8);
        setTextRGB(mutedColor);
        doc.text(
            'IRIS.SEC Compliance Report - Confidential',
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    // ===== COVER PAGE =====
    setFillRGB(primaryColor);
    doc.rect(0, 0, pageWidth, 80, 'F');

    setFillRGB(whiteColor);
    doc.circle(pageWidth / 2, 40, 15, 'F');
    doc.setFontSize(20);
    setTextRGB(primaryColor);
    doc.text('🛡️', pageWidth / 2, 43, { align: 'center' });

    doc.setFontSize(28);
    setTextRGB(whiteColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance Report', pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(18);
    doc.text('IRIS.SEC SOC Platform', pageWidth / 2, 115, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    setTextRGB(darkColor);
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.text(`Generated: ${currentDate}`, pageWidth / 2, 140, { align: 'center' });

    setDrawRGB(primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, 150, pageWidth - margin, 150);

    addFooter(1);

    // ===== PAGE 2: EXECUTIVE SUMMARY =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('Executive Summary', margin, currentY);
    currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    setTextRGB(darkColor);

    const summaryText = `This compliance report provides a comprehensive overview of the IRIS.SEC Security Operations Center platform's adherence to industry frameworks and operational metrics. The report covers NIST Cybersecurity Framework alignment, ISO 27001 control implementation, SLA compliance, and incident resolution performance.`;
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
    doc.text(splitSummary, margin, currentY);
    currentY += splitSummary.length * 6 + 10;

    // Key Metrics Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setTextRGB(darkColor);
    doc.text('Key Performance Indicators', margin, currentY);
    currentY += 10;

    autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Value', 'Status']],
        body: [
            [
                'SLA Compliance',
                `${data.slaMetrics.compliancePercentage}%`,
                data.slaMetrics.compliancePercentage >= 90 ? 'Excellent' : data.slaMetrics.compliancePercentage >= 75 ? 'Good' : 'Needs Improvement',
            ],
            [
                'Resolution Rate',
                `${data.resolutionMetrics.resolutionRate}%`,
                data.resolutionMetrics.resolutionRate >= 80 ? 'Excellent' : 'Good',
            ],
            ['MTTR', data.slaMetrics.mttr, 'Monitored'],
            ['Open Incidents', String(data.resolutionMetrics.openIncidents), 'Active'],
        ],
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 10,
            fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
    });

    addFooter(2);

    // ===== PAGE 3: NIST CSF ALIGNMENT =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('NIST Cybersecurity Framework', margin, currentY);
    currentY += 12;

    autoTable(doc, {
        startY: currentY,
        head: [['Function', 'Coverage', 'Mapped Features']],
        body: data.nistFunctions.map((func) => [
            func.name,
            `${func.coverage}%`,
            func.mappedFeatures.join(', '),
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 10,
        },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
    });

    const avgCoverage =
        data.nistFunctions.reduce((sum, func) => sum + func.coverage, 0) / data.nistFunctions.length;

    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    setTextRGB(darkColor);
    doc.text(`Overall NIST CSF Coverage: ${Math.round(avgCoverage)}%`, margin, currentY);

    addFooter(3);

    // ===== PAGE 4: ISO 27001 CONTROLS =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('ISO 27001 Control Implementation', margin, currentY);
    currentY += 12;

    autoTable(doc, {
        startY: currentY,
        head: [['Control', 'Name', 'Status', 'System Feature']],
        body: data.isoControls.map((control) => [
            control.id,
            control.name,
            control.status,
            control.mappedFeature,
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 9,
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
    });

    const implemented = data.isoControls.filter((c) => c.status === 'Implemented').length;
    const partial = data.isoControls.filter((c) => c.status === 'Partial').length;

    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    setTextRGB(darkColor);
    doc.text(
        `Controls: ${implemented} Implemented, ${partial} Partial, ${data.isoControls.length - implemented - partial} Not Covered`,
        margin,
        currentY
    );

    addFooter(4);

    // ===== PAGE 5: SLA & RESOLUTION METRICS =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('SLA Compliance & Resolution Metrics', margin, currentY);
    currentY += 12;

    // SLA Section
    doc.setFontSize(14);
    setTextRGB(darkColor);
    doc.text('Service Level Agreement Performance', margin, currentY);
    currentY += 8;

    const slaData = [
        ['Total Incidents', String(data.slaMetrics.totalIncidents)],
        ['Within SLA', String(data.slaMetrics.withinSla)],
        ['Breached SLA', String(data.slaMetrics.breachedSla)],
        ['Compliance Rate', `${data.slaMetrics.compliancePercentage}%`],
        ['Average Resolution Time', data.slaMetrics.mttr],
    ];

    autoTable(doc, {
        startY: currentY,
        body: slaData,
        theme: 'plain',
        styles: {
            fontSize: 10,
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'right', cellWidth: 'auto' },
        },
        margin: { left: margin + 10, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
    checkPageBreak(40);

    // Resolution Metrics
    doc.setFontSize(14);
    setTextRGB(darkColor);
    doc.text('Resolution Metrics', margin, currentY);
    currentY += 8;

    const resolutionData = [
        ['Resolution Rate', `${data.resolutionMetrics.resolutionRate}%`],
        ['Average Response Time', formatMinutes(data.resolutionMetrics.averageResponseMinutes)],
        [
            'Average Containment Time',
            formatMinutes(data.resolutionMetrics.averageContainmentMinutes),
        ],
        [
            'Average Resolution Time',
            formatMinutes(data.resolutionMetrics.averageResolutionMinutes),
        ],
        ['Total Incidents', String(data.resolutionMetrics.totalIncidents)],
        ['Closed Incidents', String(data.resolutionMetrics.closedIncidents)],
        ['Open Incidents', String(data.resolutionMetrics.openIncidents)],
    ];

    autoTable(doc, {
        startY: currentY,
        body: resolutionData,
        theme: 'plain',
        styles: {
            fontSize: 10,
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { halign: 'right', cellWidth: 'auto' },
        },
        margin: { left: margin + 10, right: margin },
    });

    addFooter(5);

    // ===== FINAL PAGE: RECOMMENDATIONS =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('Recommendations', margin, currentY);
    currentY += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    setTextRGB(darkColor);

    const recommendations = [
        'Continue monitoring SLA compliance to maintain above 90% threshold',
        'Address any partial ISO 27001 controls to achieve full implementation',
        'Review and optimize incident resolution workflows to reduce MTTR',
        'Conduct regular compliance audits to ensure ongoing adherence',
        'Document all security procedures and maintain audit trails',
    ];

    recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`, margin + 5, currentY);
        currentY += 10;
    });

    addFooter(6);

    // Save PDF
    doc.save(`IRIS_Compliance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
