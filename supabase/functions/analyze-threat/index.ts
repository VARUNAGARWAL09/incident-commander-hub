import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatIndicators {
  // Network indicators
  source_ip?: string;
  destination_ip?: string;
  bytes_transferred?: number;
  port?: number;
  protocol?: string;
  connection_count?: number;
  
  // Authentication indicators
  failed_login_count?: number;
  login_location?: string;
  previous_location?: string;
  time_between_locations_hours?: number;
  is_off_hours?: boolean;
  
  // Endpoint indicators
  process_name?: string;
  files_modified_count?: number;
  files_encrypted_count?: number;
  registry_keys_modified?: string[];
  privilege_escalation?: boolean;
  
  // Threat intel
  ip_reputation_score?: number;
  domain_age_days?: number;
  hash_match?: boolean;
  known_malware_family?: string;
  
  // Email indicators
  sender_domain_age?: number;
  contains_suspicious_links?: boolean;
  attachment_type?: string;
  spf_pass?: boolean;
  dkim_pass?: boolean;
}

interface AnalysisResult {
  risk_score: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  detection_reasons: string[];
  mitre_techniques: string[];
  recommended_actions: string[];
  ioc_extracts: { type: string; value: string; risk: string }[];
}

function analyzeIndicators(indicators: ThreatIndicators, alertType: string): AnalysisResult {
  let riskScore = 0;
  const detectionReasons: string[] = [];
  const mitreTechniques: string[] = [];
  const recommendedActions: string[] = [];
  const iocExtracts: { type: string; value: string; risk: string }[] = [];

  // Network-based scoring
  if (indicators.bytes_transferred) {
    if (indicators.bytes_transferred > 1000000000) { // >1GB
      riskScore += 35;
      detectionReasons.push(`Large data exfiltration detected: ${(indicators.bytes_transferred / 1000000000).toFixed(2)}GB transferred`);
      mitreTechniques.push('T1041 - Exfiltration Over C2 Channel');
      recommendedActions.push('Block outbound connection immediately');
    } else if (indicators.bytes_transferred > 100000000) { // >100MB
      riskScore += 20;
      detectionReasons.push(`Suspicious data transfer: ${(indicators.bytes_transferred / 1000000).toFixed(0)}MB`);
    }
  }

  if (indicators.connection_count && indicators.connection_count > 100) {
    riskScore += 15;
    detectionReasons.push(`Port scanning behavior: ${indicators.connection_count} connections in short period`);
    mitreTechniques.push('T1046 - Network Service Discovery');
  }

  // Authentication-based scoring
  if (indicators.failed_login_count) {
    if (indicators.failed_login_count > 10) {
      riskScore += 30;
      detectionReasons.push(`Brute force attack: ${indicators.failed_login_count} failed attempts`);
      mitreTechniques.push('T1110 - Brute Force');
      recommendedActions.push('Lock account and reset credentials');
    } else if (indicators.failed_login_count > 5) {
      riskScore += 15;
      detectionReasons.push(`Multiple failed logins: ${indicators.failed_login_count} attempts`);
    }
  }

  if (indicators.time_between_locations_hours && indicators.time_between_locations_hours < 2) {
    riskScore += 40;
    detectionReasons.push(`Impossible travel: Login from ${indicators.login_location} and ${indicators.previous_location} within ${indicators.time_between_locations_hours}h`);
    mitreTechniques.push('T1078 - Valid Accounts');
    recommendedActions.push('Verify user identity immediately');
  }

  if (indicators.is_off_hours) {
    riskScore += 10;
    detectionReasons.push('Off-hours access detected');
  }

  // Endpoint-based scoring
  if (indicators.files_encrypted_count && indicators.files_encrypted_count > 10) {
    riskScore += 50;
    detectionReasons.push(`Ransomware behavior: ${indicators.files_encrypted_count} files encrypted`);
    mitreTechniques.push('T1486 - Data Encrypted for Impact');
    recommendedActions.push('Isolate endpoint immediately', 'Initiate incident response');
  }

  if (indicators.files_modified_count && indicators.files_modified_count > 50) {
    riskScore += 25;
    detectionReasons.push(`Mass file modification: ${indicators.files_modified_count} files changed`);
  }

  if (indicators.privilege_escalation) {
    riskScore += 35;
    detectionReasons.push('Privilege escalation detected');
    mitreTechniques.push('T1548 - Abuse Elevation Control Mechanism');
    recommendedActions.push('Review process tree and parent processes');
  }

  if (indicators.registry_keys_modified && indicators.registry_keys_modified.length > 0) {
    const persistenceKeys = indicators.registry_keys_modified.filter(k => 
      k.includes('Run') || k.includes('Services') || k.includes('Startup')
    );
    if (persistenceKeys.length > 0) {
      riskScore += 30;
      detectionReasons.push(`Persistence mechanism: Registry keys modified (${persistenceKeys.join(', ')})`);
      mitreTechniques.push('T1547 - Boot or Logon Autostart Execution');
    }
  }

  // Threat intelligence scoring
  if (indicators.ip_reputation_score !== undefined) {
    if (indicators.ip_reputation_score > 80) {
      riskScore += 40;
      detectionReasons.push(`Known malicious IP (reputation score: ${indicators.ip_reputation_score}/100)`);
      if (indicators.source_ip) {
        iocExtracts.push({ type: 'ip', value: indicators.source_ip, risk: 'high' });
      }
    } else if (indicators.ip_reputation_score > 50) {
      riskScore += 20;
      detectionReasons.push(`Suspicious IP reputation (score: ${indicators.ip_reputation_score}/100)`);
    }
  }

  if (indicators.hash_match) {
    riskScore += 50;
    detectionReasons.push(`Known malware hash detected${indicators.known_malware_family ? `: ${indicators.known_malware_family}` : ''}`);
    mitreTechniques.push('T1204 - User Execution');
    recommendedActions.push('Quarantine file immediately', 'Run full system scan');
  }

  if (indicators.domain_age_days !== undefined && indicators.domain_age_days < 30) {
    riskScore += 20;
    detectionReasons.push(`Newly registered domain (${indicators.domain_age_days} days old)`);
  }

  // Email-based scoring
  if (indicators.contains_suspicious_links) {
    riskScore += 25;
    detectionReasons.push('Email contains suspicious links');
    mitreTechniques.push('T1566 - Phishing');
  }

  if (indicators.spf_pass === false || indicators.dkim_pass === false) {
    riskScore += 15;
    detectionReasons.push('Email authentication failed (SPF/DKIM)');
  }

  if (indicators.sender_domain_age !== undefined && indicators.sender_domain_age < 7) {
    riskScore += 20;
    detectionReasons.push(`Sender domain very new (${indicators.sender_domain_age} days)`);
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine severity based on risk score
  let severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  if (riskScore >= 70) severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 30) severity = 'medium';
  else if (riskScore >= 10) severity = 'low';
  else severity = 'info';

  // Calculate confidence based on number of indicators
  const confidence = Math.min(95, 50 + (detectionReasons.length * 10));

  // Default recommendations if none set
  if (recommendedActions.length === 0) {
    if (severity === 'critical' || severity === 'high') {
      recommendedActions.push('Investigate immediately', 'Consider escalating to incident');
    } else {
      recommendedActions.push('Monitor for additional activity', 'Review related logs');
    }
  }

  return {
    risk_score: riskScore,
    severity,
    confidence,
    detection_reasons: detectionReasons,
    mitre_techniques: mitreTechniques,
    recommended_actions: recommendedActions,
    ioc_extracts: iocExtracts,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alert_id, raw_data, alert_type } = await req.json();

    if (!raw_data) {
      return new Response(
        JSON.stringify({ error: 'raw_data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const indicators = raw_data as ThreatIndicators;
    const analysis = analyzeIndicators(indicators, alert_type || 'unknown');

    console.log(`Analyzed alert ${alert_id}: Risk Score ${analysis.risk_score}, Severity ${analysis.severity}`);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
