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

10. **IRIS AI Assistant** (Accessible from any page):
    *   Floating chatbot button in bottom-right corner.
    *   Visual indicators show active incidents/alerts count.
    *   Natural language queries for instant insights.
    *   Contextual help and smart suggestions based on current system state.

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
│   ├── dashboard/      # Widgets specific to the dashboard
│   ├── layout/         # MainLayout, Sidebar, Header, AssistantChatbot
│   └── ui/             # Shadcn primitives (Button, Card, Dialog, etc.)
├── context/            # Global state providers (Incidents, Simulation, Auth)
├── data/               # Static data (MITRE definitions, threat playbooks)
├── hooks/              # Custom hooks (use-toast, useAuditLog)
├── integrations/       # Third-party service clients (Supabase)
├── pages/              # Route components (Index, Incidents, Alerts, Team, Documentation)
└── lib/                # Utilities and helper functions (pdfGenerator.ts, utils.ts)
```

## 9. Recent Enhancements (v2.4.0)

### AI Assistant Chatbot (IRIS)
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

### Team Management Overhaul
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

### Custom Playbook Creation
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

### Professional PDF Documentation Generator
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

### Performance Optimizations
**Date:** February 2026  
**Impact:** High - Improves perceived responsiveness

- Reduced all page transition animations to 0.2s for snappier feel
- Minimized stagger delays in list animations
- Optimized framer-motion configurations across Dashboard, Incidents, Alerts, and Team pages
- Improved initial render performance

## 10. Future Roadmap

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

**Project Version:** 2.4.0  
**Last Updated:** February 12, 2026  
**Maintained by:** IRIS.SEC Development Team

