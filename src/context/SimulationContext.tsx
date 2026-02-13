import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationsContext';
import { useActivity } from '@/context/ActivityContext';
import { useAudioUnlock } from '@/hooks/useAudioUnlock';
import { useAuth } from '@/context/AuthContext';
import { logAuditAction } from '@/hooks/useAuditLog';
import { getNextCaseNumber } from '@/utils/incidentUtils';

// Generate realistic raw_data with threat indicators
function generateRawData(scenarioType: string) {
  const now = new Date();
  const randomIP = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Moscow, RU', 'Beijing, CN', 'São Paulo, BR', 'Mumbai, IN'];

  switch (scenarioType) {
    case 'login':
      return {
        source_ip: randomIP(),
        failed_login_count: Math.floor(Math.random() * 20) + 3,
        login_location: locations[Math.floor(Math.random() * locations.length)],
        previous_location: locations[Math.floor(Math.random() * locations.length)],
        time_between_locations_hours: Math.random() < 0.3 ? Math.random() * 2 : Math.random() * 24 + 2,
        is_off_hours: Math.random() < 0.4,
        timestamp: now.toISOString(),
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        username: `user${Math.floor(Math.random() * 1000)}@company.com`,
      };
    case 'malware':
      return {
        process_name: ['svchost.exe', 'rundll32.exe', 'powershell.exe', 'cmd.exe'][Math.floor(Math.random() * 4)],
        hash_match: Math.random() < 0.7,
        known_malware_family: ['Emotet', 'TrickBot', 'Ryuk', 'Cobalt Strike', 'Mimikatz'][Math.floor(Math.random() * 5)],
        files_modified_count: Math.floor(Math.random() * 100) + 10,
        files_encrypted_count: Math.random() < 0.5 ? Math.floor(Math.random() * 200) + 20 : 0,
        registry_keys_modified: Math.random() < 0.6 ? ['HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce'] : [],
        privilege_escalation: Math.random() < 0.4,
        endpoint: `WORKSTATION-${Math.floor(Math.random() * 100)}`,
        timestamp: now.toISOString(),
      };
    case 'exfiltration':
      return {
        source_ip: '10.0.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        destination_ip: randomIP(),
        bytes_transferred: Math.floor(Math.random() * 5000000000) + 50000000, // 50MB - 5GB
        port: [443, 8080, 22, 3389][Math.floor(Math.random() * 4)],
        protocol: ['HTTPS', 'SSH', 'RDP'][Math.floor(Math.random() * 3)],
        ip_reputation_score: Math.floor(Math.random() * 100),
        domain_age_days: Math.floor(Math.random() * 365),
        destination_domain: `transfer-${Math.random().toString(36).slice(2, 8)}.cloud`,
        timestamp: now.toISOString(),
      };
    case 'phishing':
      return {
        sender_email: `support${Math.floor(Math.random() * 100)}@${['secure-bank', 'account-verify', 'it-helpdesk'][Math.floor(Math.random() * 3)]}.com`,
        sender_domain_age: Math.floor(Math.random() * 30),
        contains_suspicious_links: true,
        attachment_type: Math.random() < 0.5 ? ['.docx', '.xlsx', '.pdf', '.zip'][Math.floor(Math.random() * 4)] : null,
        spf_pass: Math.random() < 0.3,
        dkim_pass: Math.random() < 0.3,
        recipients_count: Math.floor(Math.random() * 50) + 1,
        subject: ['Urgent: Account Verification Required', 'Your password expires today', 'Invoice attached', 'Re: Meeting tomorrow'][Math.floor(Math.random() * 4)],
        timestamp: now.toISOString(),
      };
    case 'bruteforce':
      return {
        source_ip: randomIP(),
        target_service: ['SSH', 'RDP', 'FTP', 'SMB'][Math.floor(Math.random() * 4)],
        port: [22, 3389, 21, 445][Math.floor(Math.random() * 4)],
        failed_login_count: Math.floor(Math.random() * 500) + 50,
        connection_count: Math.floor(Math.random() * 200) + 50,
        ip_reputation_score: Math.floor(Math.random() * 50) + 50,
        target_accounts: [`admin`, `root`, `administrator`, `user`],
        timestamp: now.toISOString(),
      };
    case 'ransomware':
      return {
        process_name: `${Math.random().toString(36).slice(2, 10)}.exe`,
        files_encrypted_count: Math.floor(Math.random() * 5000) + 100,
        files_modified_count: Math.floor(Math.random() * 5000) + 100,
        file_extensions_targeted: ['.docx', '.xlsx', '.pdf', '.jpg', '.png', '.sql', '.bak'],
        ransom_note_detected: true,
        registry_keys_modified: ['HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'],
        privilege_escalation: true,
        shadow_copies_deleted: Math.random() < 0.8,
        endpoint: `SERVER-${Math.floor(Math.random() * 50)}`,
        timestamp: now.toISOString(),
      };
    case 'unauthorized_access':
      return {
        source_ip: randomIP(),
        accessed_resource: ['/admin/config', '/api/users', '/database/export', '/financials/reports'][Math.floor(Math.random() * 4)],
        user_role: 'standard_user',
        required_role: 'admin',
        privilege_escalation: true,
        is_off_hours: Math.random() < 0.6,
        previous_access_attempts: Math.floor(Math.random() * 10),
        timestamp: now.toISOString(),
      };
    case 'cryptominer':
      return {
        process_name: ['xmrig.exe', 'minerd', 'cgminer'][Math.floor(Math.random() * 3)],
        cpu_usage_percent: Math.floor(Math.random() * 40) + 60,
        mining_pool_connection: `stratum+tcp://pool.${['minexmr', 'nanopool', 'f2pool'][Math.floor(Math.random() * 3)]}.com:4444`,
        ip_reputation_score: Math.floor(Math.random() * 30) + 60,
        files_modified_count: Math.floor(Math.random() * 20) + 5,
        registry_keys_modified: Math.random() < 0.5 ? ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'] : [],
        endpoint: `WORKSTATION-${Math.floor(Math.random() * 100)}`,
        timestamp: now.toISOString(),
      };
    default:
      return { timestamp: now.toISOString() };
  }
}

// Simulated threat scenarios with realistic indicators
const threatScenarios = [
  {
    title: 'Suspicious Login Attempt',
    description: 'Multiple failed login attempts detected from unusual location',
    source: 'Azure AD',
    scenarioType: 'login',
    evidenceType: 'ip' as const,
    evidenceValue: () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  },
  {
    title: 'Malware Detection',
    description: 'Potential malware binary detected on endpoint',
    source: 'CrowdStrike Falcon',
    scenarioType: 'malware',
    evidenceType: 'hash' as const,
    evidenceValue: () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  },
  {
    title: 'Data Exfiltration Alert',
    description: 'Large data transfer to external cloud service detected',
    source: 'Netskope DLP',
    scenarioType: 'exfiltration',
    evidenceType: 'url' as const,
    evidenceValue: () => `https://suspicious-${Math.random().toString(36).slice(2, 8)}.cloud/upload`,
  },
  {
    title: 'Phishing Email Detected',
    description: 'Credential harvesting email targeting employees',
    source: 'Proofpoint',
    scenarioType: 'phishing',
    evidenceType: 'email' as const,
    evidenceValue: () => `phishing${Math.floor(Math.random() * 1000)}@malicious-domain.com`,
  },
  {
    title: 'Brute Force Attack',
    description: 'Repeated authentication attempts on SSH service',
    source: 'Firewall Logs',
    scenarioType: 'bruteforce',
    evidenceType: 'ip' as const,
    evidenceValue: () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  },
  {
    title: 'Ransomware Activity',
    description: 'File encryption behavior detected on production server',
    source: 'Windows Event Log',
    scenarioType: 'ransomware',
    evidenceType: 'file' as const,
    evidenceValue: () => `C:\\Windows\\Temp\\${Math.random().toString(36).slice(2, 10)}.exe`,
  },
  {
    title: 'Unauthorized Access Attempt',
    description: 'Access to restricted resource from unauthorized user',
    source: 'Access Control System',
    scenarioType: 'unauthorized_access',
    evidenceType: 'domain' as const,
    evidenceValue: () => `unauthorized-${Math.random().toString(36).slice(2, 6)}.internal`,
  },
  {
    title: 'Cryptominer Detected',
    description: 'CPU-intensive cryptocurrency mining process found',
    source: 'EDR Console',
    scenarioType: 'cryptominer',
    evidenceType: 'hash' as const,
    evidenceValue: () => Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  },
];

// Benign evidence scenarios
const benignEvidenceScenarios = [
  {
    type: 'ip' as const,
    value: () => `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    description: 'Internal network traffic from authorized device',
  },
  {
    type: 'domain' as const,
    value: () => ['microsoft.com', 'google.com', 'github.com', 'slack.com', 'zoom.us'][Math.floor(Math.random() * 5)],
    description: 'Legitimate enterprise service connection',
  },
  {
    type: 'email' as const,
    value: () => `user${Math.floor(Math.random() * 100)}@company.com`,
    description: 'Internal employee email verified as safe',
  },
  {
    type: 'file' as const,
    value: () => `C:\\Program Files\\${['Chrome', 'Firefox', 'VSCode', 'Teams'][Math.floor(Math.random() * 4)]}\\app.exe`,
    description: 'Known legitimate software executable',
  },
  {
    type: 'hash' as const,
    value: () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    description: 'File hash matched against whitelist - verified clean',
  },
  {
    type: 'url' as const,
    value: () => `https://${['docs', 'drive', 'mail', 'calendar'][Math.floor(Math.random() * 4)]}.google.com/`,
    description: 'Approved cloud service URL',
  },
];

function generateBenignEvidence() {
  const scenario = benignEvidenceScenarios[Math.floor(Math.random() * benignEvidenceScenarios.length)];
  return {
    type: scenario.type,
    value: scenario.value(),
    description: scenario.description,
    classification: 'benign' as const,
  };
}

export interface Alert {
  id: string;
  incident_id: string | null;
  title: string;
  description: string | null;
  source: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  resolution_method: string | null;
  created_at: string;
}

export interface Evidence {
  id: string;
  incident_id: string | null;
  type: 'file' | 'hash' | 'url' | 'ip' | 'domain' | 'email' | 'other';
  value: string;
  description: string | null;
  classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  image_url: string | null;
  created_at: string;
}

interface SimulationContextType {
  isRunning: boolean;
  virtualTime: Date;
  alerts: Alert[];
  evidence: Evidence[];
  startSimulation: () => void;
  stopSimulation: () => void;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  escalateToIncident: (id: string) => Promise<string | null>;
  avgResponseTime: string;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(true);
  const [virtualTime, setVirtualTime] = useState(new Date());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const { addNotification } = useNotifications();
  const { addActivity } = useActivity();
  const { user, profile } = useAuth();

  // Get current user's display name
  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email;
    return 'System';
  };
  const isPlayingRef = useRef(false);

  // Keep stable references for timers to avoid stale closures when start/pause is toggled
  const isRunningRef = useRef(isRunning);
  const alertTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Unlock audio on mobile devices
  useAudioUnlock();

  // Live average response time that updates every second
  const [liveAvgResponseTime, setLiveAvgResponseTime] = useState('2m 15s');

  function formatResponseTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  }

  // Update live response time every second based on pending alerts (capped at 15 min)
  const MAX_RESPONSE_TIME_SECONDS = 14 * 60 + 59; // Cap at 14m 59s to stay under 15 min

  useEffect(() => {
    const updateLiveResponseTime = () => {
      const now = Date.now();
      const pendingAlerts = alerts.filter(a => a.status === 'pending');
      let currentAvg = 0;

      if (pendingAlerts.length > 0) {
        // Calculate average wait time for pending alerts
        const totalWait = pendingAlerts.reduce((sum, alert) => {
          const waitTime = (now - new Date(alert.created_at).getTime()) / 1000;
          return sum + waitTime;
        }, 0);
        currentAvg = totalWait / pendingAlerts.length;
      }

      // Blend with historical response times if available
      if (responseTimes.length > 0) {
        const historicalAvg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        // Weighted average: 70% historical, 30% current pending
        currentAvg = (historicalAvg * 0.7) + (currentAvg * 0.3);
      } else if (currentAvg === 0) {
        // Fallback if no data: baseline 45s
        currentAvg = 45;
      }

      // Add "breathing" fluctuation to make it look alive (±2-5 seconds random walk)
      // Use time-based sine wave for smooth natural fluctuation
      const fluctuation = Math.sin(now / 2000) * 3 + (Math.random() * 2 - 1);
      const displayedAvg = Math.max(15, Math.min(MAX_RESPONSE_TIME_SECONDS, currentAvg + fluctuation));

      setLiveAvgResponseTime(formatResponseTime(displayedAvg));
    };

    updateLiveResponseTime();
    const interval = setInterval(updateLiveResponseTime, 1000); // Fast update for liveness
    return () => clearInterval(interval);
  }, [alerts, responseTimes]);

  // Play voice alert using browser's built-in Speech Synthesis
  const playVoiceAlert = useCallback((text: string, severity: string) => {
    // Check if sound alerts are enabled (default to true if not set)
    const settings = localStorage.getItem('userSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.soundAlerts === false) return;
    }

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Don't overlap alerts
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(`Alert: ${text}`);

      // Configure voice settings based on severity
      utterance.rate = severity === 'critical' ? 1.2 : 1.0;
      utterance.pitch = severity === 'critical' ? 1.1 : 1.0;
      utterance.volume = 1.0;

      // Try to use a clear English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        isPlayingRef.current = false;
      };
      utterance.onerror = () => {
        isPlayingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Voice alert error:', error);
      isPlayingRef.current = false;
    }
  }, []);

  // Fetch existing alerts and evidence
  useEffect(() => {
    const fetchData = async () => {
      const [alertsRes, evidenceRes] = await Promise.all([
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50000),
        supabase.from('evidence').select('*').order('created_at', { ascending: false }).limit(50000),
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data as Alert[]);
      if (evidenceRes.data) setEvidence(evidenceRes.data as Evidence[]);
    };

    fetchData();

    // Set up real-time subscriptions
    const alertsChannel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAlerts(prev => {
            if (prev.some(a => a.id === payload.new.id)) return prev;
            return [payload.new as Alert, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new as Alert : a));
        } else if (payload.eventType === 'DELETE') {
          setAlerts(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    const evidenceChannel = supabase
      .channel('evidence-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEvidence(prev => {
            if (prev.some(e => e.id === payload.new.id)) return prev;
            return [payload.new as Evidence, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setEvidence(prev => prev.map(e => e.id === payload.new.id ? payload.new as Evidence : e));
        } else if (payload.eventType === 'DELETE') {
          setEvidence(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(evidenceChannel);
    };
  }, []);

  // Virtual time progression (Real-time speed: 1 second = 1 second)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setVirtualTime(new Date()); // Sync with real time
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Generate random alerts with real detection logic
  const generateAlert = useCallback(async () => {
    if (!isRunningRef.current) return;

    const scenario = threatScenarios[Math.floor(Math.random() * threatScenarios.length)];

    // Generate realistic raw_data based on scenario type
    const rawData = generateRawData(scenario.scenarioType);

    // Analyze the threat indicators to determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'medium';
    let analysisResult: any = null;

    try {
      const { data, error } = await supabase.functions.invoke('analyze-threat', {
        body: {
          alert_type: scenario.scenarioType,
          raw_data: rawData,
        },
      });

      if (!error && data && data.risk_score !== undefined) {
        analysisResult = data;
        severity = data.severity;
      } else {
        // Skip creating alerts without a valid score
        console.log('Skipping alert: no valid risk score from analysis');
        return;
      }
    } catch (e) {
      console.error('Threat analysis failed, skipping alert:', e);
      return;
    }

    // Store analysis result in raw_data
    const enrichedRawData = {
      ...rawData,
      analysis: analysisResult,
    };

    // Generate resolution method based on analysis
    const resolutionMethod = analysisResult?.recommended_actions?.join('; ')
      || 'Review alert details and investigate according to runbook';

    // Insert alert with dynamically determined severity
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .insert({
        title: scenario.title,
        description: scenario.description,
        source: scenario.source,
        severity: severity,
        status: 'pending',
        resolution_method: resolutionMethod,
        raw_data: enrichedRawData,
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating alert:', alertError);
      return;
    }

    if (alertData) {
      setAlerts(prev => [alertData as Alert, ...prev]);
    }

    // Sample evidence images (using placeholder security-related images)
    const sampleImages = [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop', // Security
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop', // Matrix code
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop', // Server room
      'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=400&h=300&fit=crop', // Hacker
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=300&fit=crop', // Code
      null, null, null, // Most evidence won't have images
    ];

    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];

    // Insert corresponding evidence with classification based on severity
    const evidenceClassification = severity === 'critical' ? 'malicious'
      : severity === 'high' ? 'suspicious'
        : 'unknown';

    const { error: evidenceError } = await supabase
      .from('evidence')
      .insert({
        type: scenario.evidenceType,
        value: scenario.evidenceValue(),
        description: `Evidence collected from: ${scenario.source}`,
        classification: evidenceClassification,
        image_url: randomImage,
      });

    if (evidenceError) {
      console.error('Error creating evidence:', evidenceError);
    }

    // Sometimes also generate benign evidence (about 30% of the time)
    if (Math.random() < 0.3) {
      const benignEvidence = generateBenignEvidence();
      // Benign evidence sometimes has images too
      const benignImage = Math.random() < 0.4
        ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
        : null;
      await supabase.from('evidence').insert({ ...benignEvidence, image_url: benignImage });
    }

    // Add notification based on analyzed severity
    const notificationType = severity === 'critical' ? 'critical'
      : severity === 'high' ? 'warning'
        : 'info';

    addNotification({
      type: notificationType,
      title: `Alert: ${scenario.title}`,
      message: analysisResult?.detection_reasons?.[0] || scenario.description,
    });

    // Add activity
    addActivity({
      incidentId: undefined,
      type: 'alert',
      title: `New alert: ${scenario.title}`,
      description: `Source: ${scenario.source} | Risk Score: ${analysisResult?.risk_score || 'N/A'}/100`,
    });

    // Play voice alert for critical/high severity
    playVoiceAlert(scenario.title, severity);

    // AUTO-ESCALATE: Critical alerts are automatically escalated to incidents
    if (severity === 'critical' && alertData?.id) {
      console.log('Auto-escalating critical alert to incident:', alertData.id);

      // Create incident from critical alert
      const nextCaseNumber = await getNextCaseNumber();
      const { data: incidentData, error: incidentError } = await supabase
        .from('incidents')
        .insert({
          case_number: nextCaseNumber,
          title: `[AUTO] ${scenario.title}`,
          description: `Auto-escalated critical alert: ${scenario.description}\n\nDetection: ${analysisResult?.detection_reasons?.join('; ') || 'Critical threat detected'}`,
          severity: 'critical',
          status: 'open',
          tags: [scenario.source, 'auto-escalated', 'critical'],
          alert_count: 1,
        })
        .select()
        .single();

      if (!incidentError && incidentData) {
        // Link alert to incident
        await supabase
          .from('alerts')
          .update({
            incident_id: incidentData.id,
            status: 'acknowledged',
            acknowledged_at: new Date().toISOString()
          })
          .eq('id', alertData.id);

        addNotification({
          type: 'critical',
          title: `🚨 Auto-Escalated: ${incidentData.case_number}`,
          message: `Critical alert automatically escalated to incident`,
          incidentId: incidentData.id,
          caseNumber: incidentData.case_number,
        });

        // Add activity after a short delay to ensure incident is committed
        setTimeout(() => {
          addActivity({
            incidentId: incidentData.id,
            type: 'alert',
            title: `Critical alert auto-escalated`,
            description: `${scenario.title} → ${incidentData.case_number}`,
          });
        }, 500);
      }
    }

  }, [addNotification, addActivity, playVoiceAlert]);

  // Schedule random alerts
  useEffect(() => {
    // Always clear any existing timer when toggling state
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }

    if (!isRunning) return;

    // Generate an alert every 15-45 seconds
    const scheduleNextAlert = () => {
      const delay = 15000 + Math.random() * 30000;
      alertTimeoutRef.current = window.setTimeout(async () => {
        await generateAlert();
        if (isRunningRef.current) scheduleNextAlert();
      }, delay);
    };

    scheduleNextAlert();
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    };
  }, [isRunning, generateAlert]);

  const startSimulation = () => setIsRunning(true);
  const stopSimulation = () => setIsRunning(false);

  const acknowledgeAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    // Cap response time at 14m 59s to keep avg under 15 min
    const rawResponseTime = (Date.now() - new Date(alert.created_at).getTime()) / 1000;
    const responseTime = Math.min(rawResponseTime, 14 * 60 + 59);
    setResponseTimes(prev => [...prev.slice(-19), responseTime]); // Keep last 20

    await supabase
      .from('alerts')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id);

    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString() }
        : a
    ));

    addActivity({
      incidentId: undefined,
      type: 'action',
      title: 'Alert acknowledged',
      description: alert.title,
    });

    // Log audit action with current user's name
    await logAuditAction(user?.id || null, user?.email || 'system', {
      action: 'alert_acknowledged',
      entityType: 'alert',
      entityId: id,
      entityName: alert.title,
      details: { source: alert.source, severity: alert.severity, responseTimeSeconds: responseTime, acknowledgedBy: getUserDisplayName() },
    });
  };

  const resolveAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    await supabase
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);

    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: 'resolved' as const, resolved_at: new Date().toISOString() }
        : a
    ));

    addActivity({
      incidentId: undefined,
      type: 'status_change',
      title: 'Alert resolved',
      description: `${alert.title} - Resolution: ${alert.resolution_method}`,
    });

    addNotification({
      type: 'success',
      title: 'Alert Resolved',
      message: alert.title,
    });

    // Log audit action with current user's name
    await logAuditAction(user?.id || null, user?.email || 'system', {
      action: 'alert_resolved',
      entityType: 'alert',
      entityId: id,
      entityName: alert.title,
      details: { source: alert.source, severity: alert.severity, resolutionMethod: alert.resolution_method, resolvedBy: getUserDisplayName() },
    });
  };

  const escalateToIncident = async (id: string): Promise<string | null> => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return null;

    // Create incident from alert
    const nextCaseNumber = await getNextCaseNumber();
    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .insert({
        case_number: nextCaseNumber,
        title: alert.title,
        description: alert.description || `Escalated from alert: ${alert.title}`,
        severity: alert.severity,
        status: 'open',
        tags: [alert.source, 'escalated'],
        alert_count: 1,
      })
      .select()
      .single();

    if (incidentError) {
      console.error('Error creating incident:', incidentError);
      return null;
    }

    // Link alert to incident
    const { error: linkError } = await supabase
      .from('alerts')
      .update({
        incident_id: incidentData.id,
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id);

    if (linkError) {
      console.error('Error linking alert to incident:', linkError);
    }

    // Add activity
    addActivity({
      incidentId: incidentData.id,
      type: 'alert',
      title: `Alert escalated to incident`,
      description: `${alert.title} → ${incidentData.case_number}`,
    });

    addNotification({
      type: 'warning',
      title: 'Alert Escalated',
      message: `Created incident ${incidentData.case_number} from alert`,
      incidentId: incidentData.id,
      caseNumber: incidentData.case_number,
    });

    return incidentData.id;
  };

  return (
    <SimulationContext.Provider value={{
      isRunning,
      virtualTime,
      alerts,
      evidence,
      startSimulation,
      stopSimulation,
      acknowledgeAlert,
      resolveAlert,
      escalateToIncident,
      avgResponseTime: liveAvgResponseTime,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
