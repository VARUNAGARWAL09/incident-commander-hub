# Incident Commander Hub (IRIS.SEC) - Project Documentation

## 1. Project Overview

**Project Name:** Incident Commander Hub (Internal: IRIS.SEC)
**Type:** Security Operations Center (SOC) Dashboard & Incident Response Platform
**Purpose:** To provide a comprehensive, real-time interface for security analysts to monitor, investigate, and respond to security threats. The platform simulates a realistic SOC environment with automated threat generation, real-time alerts, and incident management workflows.

The application is designed to be highly responsive, visually immersive (cyber-security aesthetic), and functional, serving as both a simulation training tool and a reference implementation for modern SOC interfaces.

## 2. Technology Stack

### Core Framework
- **React 18**: UI library for building interactive interfaces.
- **Vite**: Next-generation frontend tooling for fast builds and HMR.
- **TypeScript**: Statically typed JavaScript for type safety and better developer experience.

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Shadcn/ui**: Reusable component library based on Radix UI and Tailwind.
- **Framer Motion**: Production-ready animation library for React (used for page transitions and micro-interactions).
- **Lucide React**: Beautiful, consistent icon set.
- **Recharts**: Composable charting library for React.

### State Management & Data
- **React Context API**: Used for global state management (Incidents, Authentication, Simulation, Notifications).
- **Supabase**: Backend-as-a-Service providing:
  - **PostgreSQL Database**: Persistent storage for incidents, alerts, evidence, etc.
  - **Realtime**: WebSocket subscriptions for live updates across clients.
  - **Row Level Security (RLS)**: Data access policies.
  - **Edge Functions**: Serverless functions for logic like threat analysis (simulated).

### Document Generation & Export
- **jsPDF**: Client-side PDF generation library for professional documentation export.
- **jsPDF-AutoTable**: Plugin for creating formatted tables in PDFs.
- **Custom PDF Generator**: Professional multi-page PDF generation with branding, TOC, and structured sections.

### Key Features
- **Real-time Updates**: Instant reflection of new alerts and status changes without page refreshes.
- **Responsive Design**: Fully responsive layout for desktop and tablet interfaces.
- **Performance Optimized**: Tuned animations for smooth page transitions (0.2s duration).

## 3. Architecture & Data Flow

The application relies on a set of React Providers to manage state and business logic globally.

### Context Modules
1.  **AuthContext**: Manages user authentication state (User, Profile) via Supabase Auth.
2.  **ThemeContext**: Handles light/dark mode toggling (defaulting to a custom dark "cyber" theme).
3.  **IncidentsContext**:
    *   Fetches and manages the list of security incidents.
    *   Subscribes to `incidents` table changes for real-time updates.
    *   Provides methods to `addIncident` and `updateIncident`.
    *   Implements optimistic UI updates for immediate user feedback.
4.  **SimulationContext**:
    *   **The Brain of the App**: Generates realistic simulated threats (Phishing, Malware, Brute Force, etc.).
    *   **Auto-escalation Logic**: Automatically converts "Critical" alerts into Incidents.
    *   **Live Metrics**: Calculates real-time "Average Response Time".
    *   **Audio Alerts**: Uses Web Speech API to announce critical threats.
    *   Subscribes to `alerts` and `evidence` tables.
5.  **ActivityContext**:
    *   Logs all system events (alerts, status changes, user actions).
    *   Provides a unified feed for the Activity Log page.
6.  **NotificationsContext**:
    *   Manages toast notifications and the notification bell indicator.

## 4. Workflows & Features

### A. Threat Simulation (The Engine)
The application includes a `SimulationContext` that acts as a mock SIEM (Security Information and Event Management) system.
- **Generators**: Creates randomized raw data (IPs, hashes, emails) relevant to specific threat types (e.g., Ransomware, Exfiltration).
- **Analysis**: Simulates an AI analysis step that assigns a "Risk Score" (0-100) and severity level.
- **Evidence**: Automatically generates related artifacts (file hashes, source IPs) linked to the alert.

### B. Incident Management
- **Lifecycle**: Incidents move through statuses: `Open` -> `Investigating` -> `Contained` -> `Resolved` -> `Closed`.
- **SLA Tracking**: Visual indicators show time elapsed since creation vs. Service Level Agreements.
- **Reporting**: Ability to generate/download incident reports (mocked).

### C. MITRE ATT&CK Mapping
- **Interactive Matrix**: Visualizes the TTPs (Tactics, Techniques, and Procedures) detected in the environment.
- **Integration**: Alerts and Incidents are tagged with relevant MITRE IDs (e.g., T1566 - Phishing).

### D. Team Management (Enhanced)
- **Professional UI**: Redesigned team management interface with modern aesthetics and improved user experience.
- **View Modes**: Toggle between grid and list views for optimal team visualization.
- **Real-time Status**: Live online/offline indicators with last activity tracking for each team member.
- **Role Management**: Comprehensive role assignment system (Admin, Analyst, Viewer) with visual badges.
- **Team Analytics**: Real-time statistics including online members count and active incident assignments.
- **Search & Filter**: Advanced filtering capabilities to quickly find team members.
- **Member Cards**: Professional member cards displaying:
  - Avatar and online status
  - Role badges with color coding
  - Last activity timestamps
  - Active incident assignments
  - Quick action buttons (Edit, Remove)

**Current Team Members:**
| Name | Email | Role | Member Since |
|---|---|---|---|
| Varun Agarwal | varunagarwal.cy22 | Analyst | Jan 15, 2024 |
| Prithviraj Jaysingrao Deshmukh | prithvirajdeshmukh.cy22 | Analyst | Feb 08, 2024 |
| Yuvraj Kumar | yuvrajkumar.cy22 | Analyst | Mar 10, 2024 |

### E. IRIS AI Assistant Chatbot
The platform includes an intelligent conversational assistant providing real-time operational insights:

**Core Capabilities:**
- **Incident Lookup**: Query specific incidents by case number (e.g., "Show INC-001")
  - Displays full incident details including severity, status, timestamps, alerts, and evidence counts
- **Search & Filter**: Find incidents by keywords, severity levels, or status
- **Alert Monitoring**: View pending and recent security alerts with severity classification
- **System Status**: Check platform health, uptime, and operational metrics
- **Team Information**: Query team member availability and current assignments
- **Quick Summaries**: Generate dashboard overviews and statistical insights
- **Contextual Help**: Smart suggestions based on available data and system state

**User Experience Features:**
- Floating bot button with visual indicators for active incidents/alerts
- Clean chat interface with message history
- Typing indicators and smooth animations
- Quick suggestion chips for common queries
- Auto-scroll to latest messages
- Helpful fallback responses with query examples
- Natural language processing for intuitive interaction

**Example Queries:**
- "Show INC-001" – Display full incident details
- "Critical incidents" – List all critical priority cases
- "Recent alerts" – Show latest security detections
- "System status" – Platform health report
- "Summary" – Complete SOC dashboard overview
- "Who is online" – Current team availability

### F. Response Playbooks (Enhanced)
- **Interactive Execution**: Step-by-step playbook execution with real-time progress tracking
- **Custom Playbook Creation**: Users can create custom playbooks via professional dialog interface:
  - Name and description fields
  - Severity level selection (Critical/High/Medium/Low)
  - Estimated duration input
  - Pre-configured with 3 default steps (Initial Assessment, Execute Response, Document Results)
- **Playbook Features**:
  - Execute, pause, and reset functionality
  - Step completion tracking with timestamps
  - Manual and automated action types
  - Decision point support
  - Notes capability for each step
  - Progress bars and completion indicators
  - MITRE ATT&CK technique mapping
  - Severity filtering (All/Critical/High/Medium)

### G. Professional PDF Documentation
Advanced PDF generation system for comprehensive documentation export:

**PDF Features:**
- **Professional Cover Page**: Branded cover with IRIS.SEC logo, version number, and generation date
- **Table of Contents**: Auto-generated with accurate page numbers
- **Structured Sections**:
  1. System Overview with key capabilities
  2. Platform Features (Team Management & AI Assistant)
  3. Severity Classification & SLAs with professional tables
  4. Threat Detection Categories (dedicated page per threat)
  5. Risk Scoring Methodology
  6. Escalation Contacts with formatted cards
- **Professional Styling**:
  - Consistent emerald and slate color scheme
  - Page headers and footers with page numbers
  - Rounded rectangles and visual cards
  - Proper typography and spacing
  - Confidentiality markings
- **Smart Features**:
  - Automatic page breaks
  - Dynamic page numbering
  - Date-stamped filenames
  - Multi-page layout optimization

### H. Log Ingestion & Threat Detection
- **Log Upload & Validation**: Secure upload interface for `.log` and `.txt` files up to 10MB, featuring automatic file validation and instant previews.
- **Advanced Detection Engine**: Evaluates raw log data against 10 comprehensive security rules (covering SQLi, XSS, Brute Force, Exfiltration, etc.) using regex pattern matching.
- **Dynamic Risk Scoring**: Extracts metadata natively (IPs, sizes, times) to assign intelligent risk scores, severity categorizations, and map to MITRE ATT&CK techniques.
- **Isolated Alert Generation**: Safely produces structured, schema-compliant security alerts within the database via INSERT-only operations. Features 24-hour duplicate suppression and batch processing without disrupting the live simulation context.

### I. Compliance Dashboard
- **Regulatory Framework Coverage**: Real-time compliance status across major frameworks (SOC 2, ISO 27001, NIST CSF, GDPR, HIPAA, PCI DSS).
- **Control Mapping**: Maps security controls to specific regulatory requirements with pass/fail tracking.
- **Compliance Scoring**: Automated scoring and gap analysis across all tracked frameworks.
- **Audit Readiness**: Exportable compliance reports and evidence packages aligned to audit requirements.
- **Risk Register**: Linked view from compliance gaps to underlying risk items and open incidents.

### J. Intelligence Dashboard
- **Threat Intelligence Feed**: Aggregated feed of IOCs (Indicators of Compromise) from integrated threat intel sources.
- **Campaign Tracking**: Identifies and groups related alerts into threat actor campaigns.
- **Geo-visual Analysis**: Visual map-based representation of attack origins and impacted infrastructure.
- **IOC Enrichment**: Inline enrichment of IPs, domains, and hashes with reputation scores and context.

### K. Audit Log (Enhanced)
Full-featured immutable audit trail with the following capabilities:

- **Paginated Fetching**: Loads all records using loop-based pagination (1,000 records per page) to reliably retrieve the full audit history regardless of size.
- **Real-time Subscription**: Supabase `postgres_changes` listener on the `audit_logs` table automatically prepends new entries without requiring a manual refresh.
- **Dynamic Filters**: Filter by entity type and action type using dropdowns dynamically populated from the fetched data.
- **Full-text Search**: Search across user email, action type, entity name, and entity ID fields simultaneously.
- **User Remapping**: A `remapUserDisplay` function normalises any legacy references (e.g., removed team members) to the current active team so the audit trail appears consistent.
- **Live Statistics Panel**: Real-time counters showing total entries, incident actions, alert actions, and distinct active users.
- **Color-coded Action Badges**: Each action type (created, acknowledged, resolved, dismissed, etc.) is rendered with a unique badge color for instant visual scanning.

**Technical Implementation:**
- Component: `/src/pages/AuditLog.tsx`
- Data source: Supabase `audit_logs` table (server-side)
- Realtime channel: `audit-logs-realtime`

## 5. Page Guide

1.  **Dashboard (`/`)**:
    *   High-level metrics: Open Incidents, MTTR (Mean Time to Resolve), Active Threats.
    *   Severity distribution charts.
    *   Recent Timeline feed.
    *   Team Status (Online/Offline).

2.  **Incidents (`/incidents`)**:
    *   Kanban-style or List view of all security cases.
    *   Filtering by severity and status.
    *   Quick actions to change status or view details.

3.  **Alerts (`/alerts`)**:
    *   High-volume feed of incoming signals.
    *   "Acknowledge" or "Escalate" workflows.
    *   Shows automated risk analysis scores.

4.  **Evidence (`/evidence`)**:
    *   Repository of collected artifacts (Malware samples, suspicious IPs).
    *   Automatic classification (Malicious/Benign).

5.  **Enrichment (`/enrichment`)**:
    *   Tools to look up threat intelligence (reputation scores, WHOIS data).
    *   Interactive modules for IP, Hash, and Domain analysis.

6.  **Playbooks (`/playbooks`)**:
    *   Standard Operating Procedures (SOPs) for handling specific threats.
    *   **Create Custom Playbooks**: New dialog interface for building custom response workflows.
    *   Interactive playbook execution with step-by-step tracking.
    *   Progress visualization, step completion, and note-taking capabilities.
    *   Guides analysts through required steps (e.g., "Isolate Host", "Reset Credentials").

7.  **Team (`/team`)**:
    *   **Enhanced UI**: Professional team management interface with grid/list toggle views.
    *   Real-time online/offline status tracking for all team members.
    *   Role-based access control visualization (Admin, Analyst, Viewer).
    *   Active incident assignment tracking per team member.
    *   Search and filtering capabilities.
    *   Quick actions for role editing and member management.

8.  **Documentation (`/documentation`)**:
    *   Comprehensive platform documentation covering all features and procedures.
    *   **Professional PDF Export**: Click "Download PDF" for a multi-page, beautifully formatted documentation package.
    *   Includes severity classifications, threat categories, response procedures, and escalation contacts.
    *   MITRE ATT&CK mappings and risk scoring methodologies.

9.  **Audit Log (`/audit-log`)**:
    *   Immutable log of who did what and when (crucial for compliance).
    *   Complete audit trail for incident lifecycle and user actions.
    *   Paginated data loading, real-time updates, and dynamic filtering.

10. **IRIS AI Assistant** (Accessible from any page):
    *   Floating chatbot button in bottom-right corner.
    *   Visual indicators show active incidents/alerts count.
    *   Natural language queries for instant insights.
    *   Contextual help and smart suggestions based on current system state.

11. **Log Ingestion (`/log-ingestion`)**:
    *   Dedicated interface for uploading, previewing, and analyzing raw security logs.
    *   Displays real-time processing statistics and categorized threat detections.
    *   Allows analysts to generate system alerts seamlessly based on identified patterns.

12. **MITRE ATT&CK (`/mitre`)**:
    *   Interactive mapping of detected techniques to the MITRE ATT&CK framework matrix.
    *   Visual heatmap showing tactic and technique coverage.

13. **Compliance (`/compliance`)**:
    *   Regulatory compliance dashboard covering SOC 2, ISO 27001, NIST CSF, GDPR, HIPAA, and PCI DSS.
    *   Shows control-level pass/fail status, compliance scores, and audit readiness reports.

14. **Intelligence Dashboard (`/intelligence`)** *(internal page)*:
    *   Threat intelligence feed with IOC tracking, campaign analysis, and geo-visual attack maps.

## 6. Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Steps
1.  **Clone Repository**:
    ```bash
    git clone <repo_url>
    cd incident-commander-hub
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env` file with Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:8080`.

## 7. Performance Optimizations

- **Animation Tuning**: All page transitions and list animations have been optimized to `0.2s` duration with minimal staggering to ensure the interface feels snappy and responsive.
- **Optimistic UI**: State updates are reflected immediately in the UI while the database operation completes in the background, eliminating perceived latency.
- **Code Splitting**: Vite automatically handles chunking to ensure fast initial load times.

## 8. Directory Structure

```
src/
├── components/         # Reusable UI components
│   ├── auth/           # ProtectedRoute and auth guards
│   ├── common/         # Shared utility components
│   ├── dashboard/      # Widgets specific to the dashboard
│   ├── evidence/       # Evidence management components
│   ├── incident/       # Incident detail components
│   ├── incidents/      # Incident list/card components
│   ├── layout/         # MainLayout, Sidebar, Header, AssistantChatbot
│   ├── reports/        # Report generation components
│   ├── sla/            # SLA tracking components
│   ├── team/           # Team member card components
│   └── ui/             # Shadcn primitives (Button, Card, Dialog, etc.)
├── context/            # Global state providers (Incidents, Simulation, Auth)
├── data/               # Static data & mock data (mockData.ts, MITRE definitions)
├── hooks/              # Custom hooks (useTeamMembers, useAuditLog, useSLA, etc.)
├── integrations/       # Third-party service clients (Supabase)
├── pages/              # Route components (17 pages total)
├── services/           # Business logic services (LogIngestionService)
├── types/              # TypeScript type definitions
├── utils/              # Utilities (logParser.ts)
└── lib/                # Helper functions (pdfGenerator.ts, utils.ts)
```

## 9. Mock Data & Team Roster

The file `/src/data/mockData.ts` provides the base seed data for the simulation. It currently defines:

- **3 team member users** (see table in Section 4.D above)
- **6 mock incidents** (INC-2024-001 through INC-2024-006) across all severity levels and statuses
- **5 mock alerts** linked to incidents
- **3 mock evidence items** with chain-of-custody records
- **6 mock timeline events** for INC-2024-001
- **Dashboard stats** (156 total incidents, 12 open, 3 critical, 14m 32s avg response time)

> **Note:** Ronit Ranjan was fully removed from the codebase. All prior references (alerts, evidence chain-of-custody, timeline events) have been updated to reflect the current active team members. The `AuditLog.tsx` page contains a `remapUserDisplay()` function that maps any legacy database references to `prithvirajdeshmukh.cy22`.

## 10. Custom Hooks Reference

| Hook | File | Purpose |
|---|---|---|
| `useTeamMembers` | `hooks/useTeamMembers.ts` | Fetches profiles from Supabase, persists last-active times in `localStorage`, injects Prithviraj as a permanent mock member if absent |
| `useAuditLog` | `hooks/useAuditLog.ts` | Provides helper for writing structured entries to the `audit_logs` table |
| `useSLA` | `hooks/useSLA.ts` | Computes SLA breach status per incident based on severity thresholds |
| `useEvidenceIntegrity` | `hooks/useEvidenceIntegrity.ts` | Validates chain-of-custody integrity for evidence items |
| `useRiskScoring` | `hooks/useRiskScoring.ts` | Calculates composite risk scores from raw alert attributes |
| `useVoiceAlert` | `hooks/useVoiceAlert.ts` | Wraps Web Speech API for critical threat audio announcements |
| `useAudioUnlock` | `hooks/useAudioUnlock.ts` | Handles browser audio unlock requirement on first user interaction |

## 11. Recent Enhancements

### v2.5.0 - Data Integrity & Team Roster Update (March 2026)

#### New Team Member — Prithviraj Jaysingrao Deshmukh
**Date:** March 2026  
**Impact:** Medium — Expands team roster and updates all associated mock data

- Added `Prithviraj Jaysingrao Deshmukh` (`prithvirajdeshmukh.cy22`) as a permanent analyst in `mockData.ts` (id: `'2'`, joined Feb 08, 2024).
- Assigned Prithviraj to active incidents: INC-2024-001 (ransomware), INC-2024-002 (lateral movement), INC-2024-003 (phishing), INC-2024-004 (data exfil), INC-2024-006 (brute force).
- Prithviraj appears as the acknowledging analyst on alerts ALT-002 (mass file encryption) and ALT-003 (unusual auth pattern).
- Included in evidence chain-of-custody records (EVD-001 hash verification) and timeline events (TL-003, TL-004b).
- `useTeamMembers` hook injects Prithviraj as a permanent runtime team member (id: `mock-prithviraj-2024`) even if not present in the Supabase `profiles` table, ensuring consistent display across the Team page without requiring a database write.

#### Ronit Ranjan — Full Removal
**Date:** March 2026  
**Impact:** Medium — Data cleanup and audit trail consistency

- All references to "Ronit Ranjan" were removed from `mockData.ts`, incident assignments, alert acknowledgements, and evidence chain-of-custody.
- `AuditLog.tsx` includes a `remapUserDisplay()` function that transparently maps any historic `ronit*` email references in the live database to `prithvirajdeshmukh.cy22`, maintaining a clean audit log display without modifying production data.

#### Audit Log Enhancements
**Date:** March 2026  
**Impact:** High — Reliability and UX improvement for compliance workflows

- **Paginated bulk fetch**: Replaced single-query fetch with a `while(true)` loop fetching 1,000 records per iteration, ensuring no audit entries are silently truncated for large deployments.
- **Real-time Supabase subscription**: Added `postgres_changes` INSERT listener on `audit_logs` via the `audit-logs-realtime` channel — new entries appear instantly without requiring a page refresh.
- **User remapping layer**: `remapUserDisplay()` normalises stale email references before rendering.
- **Dynamic filter dropdowns**: Action type and entity type selects are now populated dynamically from the fetched dataset rather than being hardcoded.
- **Stats panel**: Added four summary cards (Total Entries, Incident Actions, Alert Actions, Active Users) at the top of the page.

#### useTeamMembers Hook — Persistent Last-Active Tracking
**Date:** March 2026  
**Impact:** Medium — Improves team status accuracy across sessions

- Introduced `localStorage`-backed `saveLastActive` / `getLastActive` helpers keyed by user ID.
- Current user's last-active timestamp is saved on mount and refreshed every 30 seconds via `setInterval` heartbeat.
- On profile fetch, the current user is immediately marked `is_online: true`; other members reflect their last persisted timestamp.
- A Supabase `postgres_changes` realtime subscription on the `profiles` table triggers a re-fetch whenever any profile is updated.

---

### v2.4.0 — February 2026

#### AI Assistant Chatbot (IRIS)
**Date:** February 2026  
**Impact:** High - Adds intelligent conversational interface for SOC operations

- Implemented floating chatbot accessible from all pages
- Integrated with IncidentsContext, SimulationContext, and AuthContext for real-time data access
- Natural language processing for incident queries (case number lookup)
- Smart keyword search across incident titles, descriptions, and tags
- System status reporting and dashboard summaries
- Visual indicators for active incidents/alerts on floating button
- Context-aware suggestions and helpful fallback responses
- Professional chat UI with message history, typing indicators, and smooth animations

**Technical Implementation:**
- Component: `/src/components/layout/AssistantChatbot.tsx`
- Uses React hooks (useState, useRef, useEffect) for state management
- Integrates with framer-motion for animations
- Queries actual database fields (case_number, severity, status, created_at, etc.)
- Real-time data synchronization via Context API

#### Team Management Overhaul
**Date:** February 2026  
**Impact:** Medium - Significantly improves team collaboration interface

- Complete UI redesign with professional aesthetics
- Grid and list view toggle for flexible visualization
- Real-time online/offline status indicators
- Role-based access control display (Admin/Analyst/Viewer badges)
- Active incident assignment tracking per member
- Last activity timestamps for accountability
- Search and filter capabilities for large teams
- Enhanced member cards with avatar, status, and quick actions

#### Custom Playbook Creation
**Date:** February 2026  
**Impact:** Medium - Enables dynamic playbook generation

- Professional dialog interface for creating custom response workflows
- Form validation for name, description, severity, and duration
- Auto-generation of 3 default steps (Assessment, Response, Documentation)
- Custom playbooks stored in component state and displayed alongside defaults
- Automatic playbook execution upon creation
- Severity filtering across all playbook tabs

**Technical Implementation:**
- Component: `/src/pages/Playbooks.tsx`
- New `CreatePlaybookDialog` component with form handling
- State management for custom playbooks array
- Integration with existing PlaybookCard and PlaybookDetail components

#### Professional PDF Documentation Generator
**Date:** February 2026  
**Impact:** High - Enables high-quality documentation export

- Multi-page PDF generation with professional formatting
- Branded cover page with IRIS.SEC logo and version info
- Auto-generated table of contents with page numbers
- Structured sections: Overview, Features, Severity Levels, Threats, Risk Scoring, Contacts
- Color-coded severity badges and visual cards
- Professional typography with Helvetica font family
- Page headers/footers with confidentiality markings
- Date-stamped filenames for version tracking

**Technical Implementation:**
- Library: `/src/lib/pdfGenerator.ts`
- Dependencies: jsPDF, jsPDF-AutoTable
- TypeScript interfaces for threat types and severity levels
- RGB color helpers for consistent branding
- Automatic page break detection
- Integration with Documentation page via "Download PDF" button

#### Performance Optimizations
**Date:** February 2026  
**Impact:** High - Improves perceived responsiveness

- Reduced all page transition animations to 0.2s for snappier feel
- Minimized stagger delays in list animations
- Optimized framer-motion configurations across Dashboard, Incidents, Alerts, and Team pages
- Improved initial render performance

#### Log Ingestion Module
**Date:** February 2026  
**Impact:** High - Allows custom data onboarding and dynamic threat analysis.

- Developed an entirely isolated module for processing `.log` and `.txt` files independently of the core threat simulation.
- Features real-time detection across 10 distinct security threat categories with automated risk scoring.
- Incorporates duplicate prevention mechanisms (24-hour window) and smart batch uploading to generate alerts safely.
- Built a modern, animated user interface with drag-and-drop file upload, real-time progress indicators, and comprehensive parsed log statistics.

**Technical Implementation:**
- Components: `/src/pages/LogIngestion.tsx`
- Services/Utils: `/src/services/LogIngestionService.ts`, `/src/utils/logParser.ts`
- Uses robust custom type schemas and pure INSERT-only functions to ensure side-effect-free integration.

## 12. Future Roadmap

**Planned Features:**
- Advanced NLP capabilities for IRIS chatbot
- Action execution from chatbot (acknowledge alerts, assign incidents)
- Custom playbook step editing and reordering
- PDF template customization options
- Real-time team chat integration
- Mobile application (React Native)
- Advanced threat hunting workflows
- Integration with external SIEM systems

**Technical Debt:**
- Migrate to Zustand or Redux for more complex state management
- Implement comprehensive unit and integration testing
- Add i18n support for internationalization
- Performance profiling and optimization for large datasets

---

**Project Version:** 2.5.0  
**Last Updated:** March 2026  
**Maintained by:** Varun Agarwal
