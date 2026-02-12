// MITRE ATT&CK Framework Data

export interface MitreTactic {
  id: string;
  name: string;
  shortName: string;
  description: string;
  techniques: MitreTechnique[];
}

export interface MitreTechnique {
  id: string;
  name: string;
  tacticId: string;
  description: string;
  detection: string;
  mitigation: string;
}

export const mitreTactics: MitreTactic[] = [
  {
    id: 'TA0001',
    name: 'Initial Access',
    shortName: 'Initial Access',
    description: 'The adversary is trying to get into your network.',
    techniques: [
      {
        id: 'T1566',
        name: 'Phishing',
        tacticId: 'TA0001',
        description: 'Adversaries may send phishing messages to gain access to victim systems.',
        detection: 'Monitor for suspicious email attachments and links. Analyze email headers for spoofing.',
        mitigation: 'User training, email filtering, sandboxing attachments.',
      },
      {
        id: 'T1190',
        name: 'Exploit Public-Facing Application',
        tacticId: 'TA0001',
        description: 'Adversaries may attempt to exploit a weakness in an Internet-facing host or system.',
        detection: 'Monitor application logs for exploitation attempts. Use WAF alerts.',
        mitigation: 'Regular patching, WAF deployment, vulnerability scanning.',
      },
      {
        id: 'T1133',
        name: 'External Remote Services',
        tacticId: 'TA0001',
        description: 'Adversaries may leverage external-facing remote services to initially access a network.',
        detection: 'Monitor VPN, RDP, and SSH logs for anomalous access patterns.',
        mitigation: 'MFA enforcement, network segmentation, access controls.',
      },
    ],
  },
  {
    id: 'TA0002',
    name: 'Execution',
    shortName: 'Execution',
    description: 'The adversary is trying to run malicious code.',
    techniques: [
      {
        id: 'T1059',
        name: 'Command and Scripting Interpreter',
        tacticId: 'TA0002',
        description: 'Adversaries may abuse command and script interpreters to execute commands.',
        detection: 'Monitor process command-line arguments. Log PowerShell and bash activity.',
        mitigation: 'Application whitelisting, script block logging, constrained language mode.',
      },
      {
        id: 'T1204',
        name: 'User Execution',
        tacticId: 'TA0002',
        description: 'An adversary may rely upon specific actions by a user to gain execution.',
        detection: 'Monitor for suspicious file downloads and executions.',
        mitigation: 'User training, application sandboxing, execution prevention.',
      },
      {
        id: 'T1053',
        name: 'Scheduled Task/Job',
        tacticId: 'TA0002',
        description: 'Adversaries may abuse task scheduling functionality to facilitate execution.',
        detection: 'Monitor scheduled task creation and modification events.',
        mitigation: 'Restrict task creation permissions, audit scheduled tasks.',
      },
    ],
  },
  {
    id: 'TA0003',
    name: 'Persistence',
    shortName: 'Persistence',
    description: 'The adversary is trying to maintain their foothold.',
    techniques: [
      {
        id: 'T1547',
        name: 'Boot or Logon Autostart Execution',
        tacticId: 'TA0003',
        description: 'Adversaries may configure system settings to automatically execute a program during boot.',
        detection: 'Monitor registry run keys and startup folders.',
        mitigation: 'Restrict registry permissions, monitor startup locations.',
      },
      {
        id: 'T1136',
        name: 'Create Account',
        tacticId: 'TA0003',
        description: 'Adversaries may create an account to maintain access to victim systems.',
        detection: 'Monitor for new account creation events.',
        mitigation: 'Multi-factor authentication, privileged access management.',
      },
      {
        id: 'T1078',
        name: 'Valid Accounts',
        tacticId: 'TA0003',
        description: 'Adversaries may obtain and abuse credentials of existing accounts.',
        detection: 'Monitor for unusual account activity and authentication anomalies.',
        mitigation: 'Password policies, MFA, credential monitoring.',
      },
    ],
  },
  {
    id: 'TA0004',
    name: 'Privilege Escalation',
    shortName: 'Priv Esc',
    description: 'The adversary is trying to gain higher-level permissions.',
    techniques: [
      {
        id: 'T1068',
        name: 'Exploitation for Privilege Escalation',
        tacticId: 'TA0004',
        description: 'Adversaries may exploit software vulnerabilities to elevate privileges.',
        detection: 'Monitor for exploitation indicators and unusual process behavior.',
        mitigation: 'Regular patching, exploit protection, application isolation.',
      },
      {
        id: 'T1548',
        name: 'Abuse Elevation Control Mechanism',
        tacticId: 'TA0004',
        description: 'Adversaries may circumvent mechanisms designed to control elevated privileges.',
        detection: 'Monitor UAC bypass attempts and sudo abuse.',
        mitigation: 'Configure UAC to highest level, audit sudo usage.',
      },
    ],
  },
  {
    id: 'TA0005',
    name: 'Defense Evasion',
    shortName: 'Defense Evasion',
    description: 'The adversary is trying to avoid being detected.',
    techniques: [
      {
        id: 'T1070',
        name: 'Indicator Removal',
        tacticId: 'TA0005',
        description: 'Adversaries may delete or modify artifacts to remove evidence.',
        detection: 'Monitor for log clearing and file deletion events.',
        mitigation: 'Centralized logging, file integrity monitoring.',
      },
      {
        id: 'T1562',
        name: 'Impair Defenses',
        tacticId: 'TA0005',
        description: 'Adversaries may disable security tools to avoid detection.',
        detection: 'Monitor for security tool process termination.',
        mitigation: 'Tamper protection, process monitoring, EDR.',
      },
      {
        id: 'T1027',
        name: 'Obfuscated Files or Information',
        tacticId: 'TA0005',
        description: 'Adversaries may attempt to make files difficult to discover or analyze.',
        detection: 'Static and dynamic analysis of suspicious files.',
        mitigation: 'Behavior-based detection, sandboxing.',
      },
    ],
  },
  {
    id: 'TA0006',
    name: 'Credential Access',
    shortName: 'Cred Access',
    description: 'The adversary is trying to steal account credentials.',
    techniques: [
      {
        id: 'T1003',
        name: 'OS Credential Dumping',
        tacticId: 'TA0006',
        description: 'Adversaries may attempt to dump credentials from the operating system.',
        detection: 'Monitor for LSASS access and credential dumping tools.',
        mitigation: 'Credential Guard, LSASS protection, disable WDigest.',
      },
      {
        id: 'T1110',
        name: 'Brute Force',
        tacticId: 'TA0006',
        description: 'Adversaries may use brute force techniques to attempt access to accounts.',
        detection: 'Monitor for failed authentication attempts.',
        mitigation: 'Account lockout policies, MFA, rate limiting.',
      },
    ],
  },
  {
    id: 'TA0007',
    name: 'Discovery',
    shortName: 'Discovery',
    description: 'The adversary is trying to figure out your environment.',
    techniques: [
      {
        id: 'T1082',
        name: 'System Information Discovery',
        tacticId: 'TA0007',
        description: 'An adversary may attempt to get detailed information about the operating system.',
        detection: 'Monitor for system enumeration commands.',
        mitigation: 'Limit information disclosure, monitoring.',
      },
      {
        id: 'T1083',
        name: 'File and Directory Discovery',
        tacticId: 'TA0007',
        description: 'Adversaries may enumerate files and directories.',
        detection: 'Monitor for excessive file system enumeration.',
        mitigation: 'File access controls, monitoring.',
      },
    ],
  },
  {
    id: 'TA0008',
    name: 'Lateral Movement',
    shortName: 'Lateral Mvmt',
    description: 'The adversary is trying to move through your environment.',
    techniques: [
      {
        id: 'T1021',
        name: 'Remote Services',
        tacticId: 'TA0008',
        description: 'Adversaries may use valid accounts to log into remote services.',
        detection: 'Monitor for unusual remote access patterns.',
        mitigation: 'Network segmentation, MFA, jump servers.',
      },
      {
        id: 'T1570',
        name: 'Lateral Tool Transfer',
        tacticId: 'TA0008',
        description: 'Adversaries may transfer tools between systems within a compromised network.',
        detection: 'Monitor for file transfers between internal systems.',
        mitigation: 'Network segmentation, file transfer monitoring.',
      },
    ],
  },
  {
    id: 'TA0009',
    name: 'Collection',
    shortName: 'Collection',
    description: 'The adversary is trying to gather data of interest.',
    techniques: [
      {
        id: 'T1005',
        name: 'Data from Local System',
        tacticId: 'TA0009',
        description: 'Adversaries may search local system sources for data of interest.',
        detection: 'Monitor for unusual file access patterns.',
        mitigation: 'Data loss prevention, file access controls.',
      },
      {
        id: 'T1114',
        name: 'Email Collection',
        tacticId: 'TA0009',
        description: 'Adversaries may target user email to collect sensitive information.',
        detection: 'Monitor for unusual email access or forwarding rules.',
        mitigation: 'Email DLP, mailbox auditing.',
      },
    ],
  },
  {
    id: 'TA0010',
    name: 'Exfiltration',
    shortName: 'Exfiltration',
    description: 'The adversary is trying to steal data.',
    techniques: [
      {
        id: 'T1041',
        name: 'Exfiltration Over C2 Channel',
        tacticId: 'TA0010',
        description: 'Adversaries may steal data by exfiltrating it over an existing C2 channel.',
        detection: 'Monitor for large outbound data transfers.',
        mitigation: 'Network monitoring, data loss prevention.',
      },
      {
        id: 'T1567',
        name: 'Exfiltration Over Web Service',
        tacticId: 'TA0010',
        description: 'Adversaries may use web services to exfiltrate data.',
        detection: 'Monitor for uploads to cloud storage services.',
        mitigation: 'Cloud access security broker, URL filtering.',
      },
    ],
  },
  {
    id: 'TA0011',
    name: 'Command and Control',
    shortName: 'C2',
    description: 'The adversary is trying to communicate with compromised systems.',
    techniques: [
      {
        id: 'T1071',
        name: 'Application Layer Protocol',
        tacticId: 'TA0011',
        description: 'Adversaries may communicate using OSI application layer protocols.',
        detection: 'Deep packet inspection, protocol analysis.',
        mitigation: 'Network monitoring, proxy inspection.',
      },
      {
        id: 'T1573',
        name: 'Encrypted Channel',
        tacticId: 'TA0011',
        description: 'Adversaries may employ encryption to conceal C2 traffic.',
        detection: 'TLS inspection, JA3 fingerprinting.',
        mitigation: 'SSL/TLS inspection, certificate monitoring.',
      },
    ],
  },
  {
    id: 'TA0040',
    name: 'Impact',
    shortName: 'Impact',
    description: 'The adversary is trying to manipulate, interrupt, or destroy systems and data.',
    techniques: [
      {
        id: 'T1486',
        name: 'Data Encrypted for Impact',
        tacticId: 'TA0040',
        description: 'Adversaries may encrypt data on target systems to interrupt availability.',
        detection: 'Monitor for mass file encryption activity.',
        mitigation: 'Backup solutions, ransomware protection.',
      },
      {
        id: 'T1489',
        name: 'Service Stop',
        tacticId: 'TA0040',
        description: 'Adversaries may stop or disable services on a system.',
        detection: 'Monitor for service stop events.',
        mitigation: 'Service protection, process monitoring.',
      },
    ],
  },
];

// Get all techniques as a flat array
export const getAllTechniques = (): MitreTechnique[] => {
  return mitreTactics.flatMap(tactic => tactic.techniques);
};

// Get technique by ID
export const getTechniqueById = (id: string): MitreTechnique | undefined => {
  return getAllTechniques().find(t => t.id === id);
};

// Get tactic by ID
export const getTacticById = (id: string): MitreTactic | undefined => {
  return mitreTactics.find(t => t.id === id);
};

// Map incident types to likely MITRE techniques
export const incidentTypeToTechniques: Record<string, string[]> = {
  'phishing': ['T1566', 'T1204', 'T1114'],
  'malware': ['T1059', 'T1547', 'T1027', 'T1486'],
  'ransomware': ['T1486', 'T1489', 'T1059', 'T1070'],
  'data_breach': ['T1005', 'T1041', 'T1567', 'T1114'],
  'unauthorized_access': ['T1078', 'T1110', 'T1021', 'T1133'],
  'dos': ['T1489', 'T1499'],
  'insider_threat': ['T1078', 'T1005', 'T1567', 'T1070'],
  'credential_theft': ['T1003', 'T1110', 'T1078'],
  'lateral_movement': ['T1021', 'T1570', 'T1078'],
  'c2': ['T1071', 'T1573', 'T1059'],
};
