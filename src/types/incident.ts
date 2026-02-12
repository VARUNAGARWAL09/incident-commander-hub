// Core types for the Incident Management Platform

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export type UserRole = 'admin' | 'analyst' | 'viewer';

export type EvidenceType = 'file' | 'hash' | 'url' | 'ip' | 'domain' | 'email' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  createdAt: Date;
  lastActive?: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdAt: Date;
}

export interface Incident {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  tags: string[];
  assignedTo: User[];
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  alertCount: number;
  evidenceCount: number;
}

export interface Alert {
  id: string;
  incidentId: string;
  title: string;
  source: string;
  severity: Severity;
  rawData?: Record<string, unknown>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: User;
  acknowledgedAt?: Date;
}

export interface Evidence {
  id: string;
  incidentId: string;
  type: EvidenceType;
  value: string;
  description?: string;
  metadata?: Record<string, unknown>;
  classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  chainOfCustody: CustodyEntry[];
  linkedIncidents?: string[];
  addedBy: User;
  addedAt: Date;
}

export interface CustodyEntry {
  id: string;
  action: string;
  performedBy: User;
  performedAt: Date;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  type: 'action' | 'note' | 'evidence' | 'status_change' | 'assignment' | 'alert';
  title: string;
  description?: string;
  createdBy: User;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Comment {
  id: string;
  incidentId: string;
  parentId?: string;
  content: string;
  createdBy: User;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: 'incident' | 'evidence' | 'alert' | 'user' | 'team';
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  avgResponseTime: string;
  resolvedToday: number;
  activeAnalysts: number;
  alertsToday: number;
  evidenceCollected: number;
}

export interface EnrichmentResult {
  id: string;
  indicatorValue: string;
  indicatorType: EvidenceType;
  source: string;
  results: Record<string, unknown>;
  riskScore?: number;
  tags?: string[];
  enrichedAt: Date;
}
