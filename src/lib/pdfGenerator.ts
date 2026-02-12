import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ThreatType {
    name: string;
    category: string;
    severity: string;
    indicators: string[];
    response: string[];
    mitre: string[];
}

interface SeverityLevel {
    level: string;
    score: string;
    description: string;
    sla: string;
    actions: string[];
}

type RGBColor = [number, number, number];

export const generateDocumentationPDF = (
    threatTypes: ThreatType[],
    severityLevels: SeverityLevel[]
) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor: RGBColor = [16, 185, 129];
    const darkColor: RGBColor = [15, 23, 42];
    const mutedColor: RGBColor = [100, 116, 139];
    const whiteColor: RGBColor = [255, 255, 255];
    const lightGray: RGBColor = [248, 250, 252];

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    // Helper to set RGB color
    const setFillRGB = (color: RGBColor) => doc.setFillColor(color[0], color[1], color[2]);
    const setTextRGB = (color: RGBColor) => doc.setTextColor(color[0], color[1], color[2]);
    const setDrawRGB = (color: RGBColor) => doc.setDrawColor(color[0], color[1], color[2]);

    // Helper function to add new page if needed
    const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            return true;
        }
        return false;
    };

    // Helper function to add footer
    const addFooter = (pageNum: number) => {
        doc.setFontSize(8);
        setTextRGB(mutedColor);
        doc.text(
            'IRIS Security Operations Center - Confidential',
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            `Page ${pageNum}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
        );
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
    doc.text('Security Operations Center', pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(22);
    doc.text('Threat Detection & Response', pageWidth / 2, 115, { align: 'center' });
    doc.text('Documentation', pageWidth / 2, 130, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    setTextRGB(darkColor);
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Version 2.4.0`, pageWidth / 2, 155, { align: 'center' });
    doc.text(`Generated: ${currentDate}`, pageWidth / 2, 165, { align: 'center' });

    setDrawRGB(primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, 175, pageWidth - margin, 175);

    doc.setFontSize(10);
    setTextRGB(mutedColor);
    doc.text('INTERNAL USE ONLY - CONFIDENTIAL', pageWidth / 2, pageHeight - 30, {
        align: 'center'
    });

    addFooter(1);

    // ===== Page 2: TABLE OF CONTENTS =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(darkColor);
    doc.text('Table of Contents', margin, currentY);
    currentY += 15;

    const tocItems = [
        { title: '1. System Overview', page: 3 },
        { title: '2. Platform Features', page: 4 },
        { title: '3. Severity Classification & SLAs', page: 5 },
        { title: '4. Threat Detection Categories', page: 6 },
        { title: '5. Risk Scoring Methodology', page: `${6 + threatTypes.length}` },
        { title: '6. Escalation Contacts', page: `${7 + threatTypes.length}` }
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    tocItems.forEach(item => {
        setTextRGB(darkColor);
        doc.text(item.title, margin + 5, currentY);
        setTextRGB(mutedColor);
        doc.text(String(item.page), pageWidth - margin - 10, currentY, { align: 'right' });
        currentY += 8;
    });

    addFooter(2);

    // ===== Page 3: SYSTEM OVERVIEW =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('1. System Overview', margin, currentY);
    currentY += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    setTextRGB(darkColor);
    const overviewText = `The IRIS Incident Response Platform is a comprehensive Security Operations Center (SOC) solution that provides real-time threat detection, automated analysis, and incident management capabilities.`;

    const splitOverview = doc.splitTextToSize(overviewText, pageWidth - 2 * margin);
    doc.text(splitOverview, margin, currentY);
    currentY += splitOverview.length * 6 + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('Key Capabilities', margin, currentY);
    currentY += 10;

    const features = [
        { title: 'Real-Time Detection', desc: 'Continuous monitoring with 15+ threat indicators' },
        { title: 'Auto-Escalation', desc: 'Critical alerts automatically escalate to incidents' },
        { title: 'Team Coordination', desc: 'Real-time collaboration with assignment tracking' },
        { title: 'AI Assistant (IRIS)', desc: 'Intelligent chatbot for operational insights' }
    ];

    features.forEach(feature => {
        checkPageBreak(15);

        doc.setFillColor(240, 240, 240);
        doc.roundedRect(margin, currentY - 5, pageWidth - 2 * margin, 12, 2, 2, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setTextRGB(darkColor);
        doc.text(`• ${feature.title}`, margin + 3, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setTextRGB(mutedColor);
        doc.text(feature.desc, margin + 3, currentY + 5);

        currentY += 17;
    });

    addFooter(3);

    // ===== Page 4: PLATFORM FEATURES =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('2. Platform Features', margin, currentY);
    currentY += 12;

    doc.setFontSize(14);
    setTextRGB(darkColor);
    doc.text('Team Management', margin, currentY);
    currentY += 8;

    const teamFeatures = [
        'View Modes: Grid and list views',
        'Live Status: Real-time tracking',
        'Role Management: Admin, Analyst, Viewer',
        'Team Analytics: Statistics and assignments'
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    teamFeatures.forEach(feat => {
        setTextRGB(darkColor);
        doc.text('✓', margin + 2, currentY);
        setTextRGB(mutedColor);
        doc.text(feat, margin + 8, currentY);
        currentY += 6;
    });

    currentY += 5;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setTextRGB(darkColor);
    doc.text('IRIS AI Assistant', margin, currentY);
    currentY += 8;

    const aiFeatures = [
        'Incident Lookup by case number',
        'Search & Filter capabilities',
        'Alert Monitoring',
        'System Status checks',
        'Quick dashboard summaries'
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    aiFeatures.forEach(feat => {
        setTextRGB(darkColor);
        doc.text('✓', margin + 2, currentY);
        setTextRGB(mutedColor);
        doc.text(feat, margin + 8, currentY);
        currentY += 6;
    });

    addFooter(4);

    // ===== Page 5: SEVERITY LEVELS =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('3. Severity Classification & SLAs', margin, currentY);
    currentY += 12;

    autoTable(doc, {
        startY: currentY,
        head: [['Level', 'Score', 'SLA', 'Description']],
        body: severityLevels.map(level => [
            level.level,
            level.score,
            level.sla,
            level.description
        ]),
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: darkColor
        },
        margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    addFooter(5);

    // ===== THREAT TYPES =====
    let pageNum = 6;
    threatTypes.forEach((threat, index) => {
        doc.addPage();
        currentY = margin;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        setTextRGB(primaryColor);
        doc.text(`${index + 1}. ${threat.name}`, margin, currentY);
        currentY += 10;

        const getSeverityColor = (sev: string): RGBColor => {
            switch (sev) {
                case 'critical': return [220, 38, 38];
                case 'high': return [234, 88, 12];
                case 'medium': return [234, 179, 8];
                default: return [100, 116, 139];
            }
        };

        const severityColor = getSeverityColor(threat.severity);
        setFillRGB(severityColor);
        doc.roundedRect(margin, currentY, 30, 6, 1, 1, 'F');
        setTextRGB(whiteColor);
        doc.setFontSize(10);
        doc.text(threat.severity.toUpperCase(), margin + 15, currentY + 4, { align: 'center' });

        currentY += 12;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        setTextRGB(darkColor);
        doc.text('Detection Indicators', margin, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        setTextRGB(mutedColor);
        threat.indicators.forEach(indicator => {
            checkPageBreak(8);
            const indicatorLines = doc.splitTextToSize(`• ${indicator}`, pageWidth - 2 * margin - 5);
            doc.text(indicatorLines, margin + 2, currentY);
            currentY += indicatorLines.length * 5;
        });
        currentY += 5;

        checkPageBreak(15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        setTextRGB(darkColor);
        doc.text('Response Procedures', margin, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        setTextRGB(mutedColor);
        threat.response.forEach((step, i) => {
            checkPageBreak(8);
            const stepLines = doc.splitTextToSize(`${i + 1}. ${step}`, pageWidth - 2 * margin - 5);
            doc.text(stepLines, margin + 2, currentY);
            currentY += stepLines.length * 5;
        });

        addFooter(pageNum);
        pageNum++;
    });

    // ===== RISK SCORING =====
    doc.addPage();
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('5. Risk Scoring Methodology', margin, currentY);
    currentY += 12;

    autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Examples', 'Max Impact']],
        body: [
            ['Network Anomalies', 'Data transfer, port scanning', '+35 points'],
            ['Authentication', 'Failed logins, impossible travel', '+40 points'],
            ['Endpoint Behavior', 'File encryption, escalation', '+50 points'],
            ['Threat Intel', 'Hash matches, domain age', '+50 points'],
            ['Email Security', 'SPF/DKIM, suspicious links', '+25 points']
        ],
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9
        },
        margin: { left: margin, right: margin }
    });

    addFooter(pageNum);

    // ===== ESCALATION CONTACTS =====
    doc.addPage();
    pageNum++;
    currentY = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    setTextRGB(primaryColor);
    doc.text('6. Escalation Contacts', margin, currentY);
    currentY += 12;

    const contacts = [
        { tier: 'Tier 1 - SOC Analysts', email: 'soc-team@company.com' },
        { tier: 'Tier 2 - Security Engineers', email: 'security-engineers@company.com' },
        { tier: 'Tier 3 - Incident Response', email: 'ir-team@company.com' },
        { tier: 'Management', email: 'ciso@company.com' }
    ];

    contacts.forEach(contact => {
        setFillRGB(lightGray);
        doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 12, 2, 2, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setTextRGB(darkColor);
        doc.text(contact.tier, margin + 3, currentY + 4);

        doc.setFont('helvetica', 'italic');
        setTextRGB(primaryColor);
        doc.setFontSize(9);
        doc.text(contact.email, margin + 3, currentY + 9);

        currentY += 17;
    });

    addFooter(pageNum);

    // Save the PDF
    doc.save(`IRIS_SOC_Documentation_${new Date().toISOString().split('T')[0]}.pdf`);
};
