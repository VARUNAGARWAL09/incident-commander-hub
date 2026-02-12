# 🛡️ IRIS.SEC - Incident Commander Hub

[![Version](https://img.shields.io/badge/version-2.4.0-emerald.svg)](https://github.com/VARUNAGARWAL09/incident-commander-hub)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5.3-blue.svg)](https://www.typescriptlang.org/)

> **A comprehensive Security Operations Center (SOC) platform for real-time threat detection, incident response, and security operations management.**

IRIS.SEC (Incident Response & Intelligence System - Security Operations Center) is a modern, full-featured SOC dashboard and incident management platform designed for security analysts, threat hunters, and SOC teams.

## ✨ Key Features

### 🤖 **IRIS AI Assistant**
- Intelligent conversational chatbot for SOC operations
- Natural language incident queries (e.g., "Show INC-001")
- Real-time system status and metrics
- Contextual help and smart suggestions
- Search incidents by keywords, severity, or status

### 📊 **Real-Time Dashboard**
- Live metrics: Open Incidents, MTTR, Active Threats
- Severity distribution charts with Recharts
- Recent activity timeline
- Team status monitoring (online/offline)
- Critical alert notifications with audio announcements

### 🚨 **Threat Detection & Alerts**
- Simulated SIEM with 15+ threat indicators
- Auto-escalation of critical alerts to incidents
- Risk scoring (0-100) based on multiple factors
- MITRE ATT&CK technique mapping
- Evidence collection and artifact management

### 📋 **Incident Management**
- Full incident lifecycle: Open → Investigating → Contained → Resolved → Closed
- SLA tracking with visual indicators
- Kanban and list views
- Case number tracking (INC-XXX format)
- Assignment and status updates with audit trail

### 👥 **Team Management**
- Professional grid/list view interfaces
- Real-time online/offline status
- Role-based access control (Admin, Analyst, Viewer)
- Active incident assignments per member
- Search and filter capabilities

### 📖 **Response Playbooks**
- Pre-built playbooks for common threats (Phishing, Ransomware, Data Breach, etc.)
- **Custom playbook creation** with dialog interface
- Step-by-step execution tracking
- Progress bars and completion indicators
- Notes and timestamp logging for each step

### 📄 **Professional PDF Export**
- Multi-page documentation generation
- Branded cover page with IRIS.SEC logo
- Auto-generated table of contents
- Structured sections: Overview, Features, Severity Levels, Threats, Risk Scoring
- Color-coded severity badges and professional formatting

### 🔍 **Threat Intelligence**
- IP reputation lookup
- File hash analysis
- Domain investigation with WHOIS data
- Interactive enrichment modules

### 📝 **Comprehensive Logging**
- Activity log for all system events
- Audit trail with user actions and timestamps
- Compliance-ready immutable logs

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase account** (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VARUNAGARWAL09/incident-commander-hub.git
   cd incident-commander-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:8080`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 🏗️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Component library (Radix UI + Tailwind)
- **Framer Motion** - Animations and transitions
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend & Data
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data access policies
- **Realtime subscriptions** - Live updates via WebSocket

### Additional Libraries
- **jsPDF** + **jsPDF-AutoTable** - PDF generation
- **date-fns** - Date formatting
- **React Router** - Navigation (via Tanstack Router)

## 📖 Usage Guide

### AI Assistant Chatbot

Click the floating bot button in the bottom-right corner to interact with IRIS:

**Example Queries:**
- `"Show INC-001"` - Get full incident details
- `"Critical incidents"` - List all critical cases
- `"Recent alerts"` - View latest detections
- `"System status"` - Platform health check
- `"Summary"` - Dashboard overview
- `"Who is online"` - Team availability

### Creating a Custom Playbook

1. Navigate to **Playbooks** page
2. Click **"Create Playbook"** button
3. Fill in the form:
   - Name (required)
   - Description (required)
   - Severity level (Critical/High/Medium/Low)
   - Estimated duration (minutes)
4. Click **"Create Playbook"**
5. Your playbook opens automatically with 3 default steps

### Generating Documentation PDF

1. Go to **Documentation** page
2. Click **"Download PDF"** button (top-right)
3. A professional, multi-page PDF will be generated and downloaded

### Managing Team Members

1. Visit **Team** page
2. Toggle between Grid/List views
3. Use search bar to find members
4. View online status, roles, and active assignments
5. Click member cards for details and actions

## 🎨 Features Overview

### Dashboard Widgets
- **Metrics Cards**: Open Incidents, MTTR, Active Threats, Team Status
- **Severity Charts**: Pie chart showing incident distribution
- **Activity Timeline**: Recent events and alerts
- **Quick Actions**: New Incident, Run Simulation, View Reports

### Incident Statuses
| Status | Description | Color |
|--------|-------------|-------|
| Open | Newly created, awaiting assignment | Gray |
| Investigating | Analyst actively working | Blue |
| Contained | Threat isolated, impact minimized | Orange |
| Resolved | Root cause addressed | Green |
| Closed | Fully documented and archived | Slate |

### Severity Levels
| Level | Risk Score | SLA | Color |
|-------|------------|-----|-------|
| Critical | 90-100 | 15 min | Red |
| High | 70-89 | 1 hour | Orange |
| Medium | 40-69 | 4 hours | Yellow |
| Low | 0-39 | 24 hours | Gray |

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard-specific widgets
│   ├── layout/             # MainLayout, Sidebar, Header, AssistantChatbot
│   └── ui/                 # Reusable UI components (shadcn/ui)
├── context/                # Global state (Incidents, Simulation, Auth, Notifications)
├── data/                   # Static data (MITRE ATT&CK, threat definitions)
├── hooks/                  # Custom React hooks
├── integrations/           # Supabase client and API integrations
├── lib/                    # Utilities (pdfGenerator, cn, etc.)
├── pages/                  # Route components
│   ├── Index.tsx           # Dashboard
│   ├── Incidents.tsx       # Incident management
│   ├── Alerts.tsx          # Alert feed
│   ├── Evidence.tsx        # Artifact repository
│   ├── Playbooks.tsx       # Response playbooks
│   ├── Team.tsx            # Team management
│   ├── Documentation.tsx   # Platform docs
│   └── ...
└── App.tsx                 # Main application component
```

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Role-based access control** (Admin, Analyst, Viewer)
- **Audit logging** for all operations
- **Session management** via Supabase Auth
- **Secure environment variables** for sensitive data

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced NLP for IRIS chatbot
- [ ] Action execution from chatbot (acknowledge, assign, escalate)
- [ ] Custom playbook step editing
- [ ] Mobile application (React Native)
- [ ] Integration with external SIEM systems
- [ ] Real-time collaborative editing
- [ ] Threat hunting workbench
- [ ] Automated response orchestration

### Technical Improvements
- [ ] Migrate to Zustand for state management
- [ ] Comprehensive unit and E2E testing
- [ ] i18n support for internationalization
- [ ] Performance optimization for large datasets
- [ ] Accessibility (WCAG 2.1 AA compliance)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Varun Agarwal**
- GitHub: [@VARUNAGARWAL09](https://github.com/VARUNAGARWAL09)

## 🙏 Acknowledgments

- [MITRE ATT&CK®](https://attack.mitre.org/) for the threat framework
- [Shadcn/ui](https://ui.shadcn.com/) for the component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide](https://lucide.dev/) for the icon set

## 📞 Support

For questions, issues, or feature requests:
- Open an [Issue](https://github.com/VARUNAGARWAL09/incident-commander-hub/issues)
- Email: varun@example.com (replace with actual email)

---

**Version:** 2.4.0  
**Last Updated:** February 12, 2026  
**Status:** Active Development 🚀

Made with ❤️ for the cybersecurity community
