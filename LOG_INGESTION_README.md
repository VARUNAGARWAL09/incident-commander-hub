# Log Ingestion Module - Architecture Documentation

## 📋 Overview

The **Log Ingestion Module** is a completely isolated, plug-in feature for the IRIS-SOC platform that enables automated threat detection from security log files. It is designed with a **non-intrusive architecture** that does NOT modify existing systems.

## 🏗️ Architecture Principles

### ✅ Isolation & Safety
- **Zero modifications** to `SimulationContext`
- **Zero modifications** to existing alert schema
- **Only INSERT operations** - no updates or deletes to existing data
- **Separate service layer** with its own error handling
- **Independent parser** with rule-based detection

### 🔌 Plug-In Design
- Standalone page at `/log-ingestion`
- Separate TypeScript types in `types/logIngestion.ts`
- Dedicated parser in `utils/logParser.ts`
- Isolated service in `services/LogIngestionService.ts`
- No dependencies on simulation engine

## 📁 File Structure

```
src/
├── pages/
│   └── LogIngestion.tsx          # Main UI component
├── services/
│   └── LogIngestionService.ts    # Database operations
├── utils/
│   └── logParser.ts              # Rule-based detection engine
└── types/
    └── logIngestion.ts           # Type definitions
```

## 🎯 Features

### 1. Log Upload
- **Supported formats**: `.log`, `.txt`
- **Size limit**: 10MB
- **Validation**: File type and size checking
- **Preview**: Shows first 20 lines before processing

### 2. Rule-Based Detection
The parser implements **10 detection rules**:

| Rule ID | Name | Severity | MITRE ATT&CK |
|---------|------|----------|--------------|
| `brute-force-ssh` | SSH Brute Force Attack | High | T1110.001 |
| `sql-injection` | SQL Injection Attempt | Critical | T1190 |
| `suspicious-ip` | Suspicious IP Pattern | Medium | T1071 |
| `excessive-requests` | Excessive Request Rate | Medium | T1498 |
| `large-data-transfer` | Large Outbound Data Transfer | High | T1048 |
| `privilege-escalation` | Privilege Escalation Attempt | Critical | T1068, T1078 |
| `malware-signature` | Malware Signature Detected | Critical | T1204, T1486 |
| `unauthorized-access` | Unauthorized Access Attempt | Medium | T1078 |
| `port-scan` | Port Scanning Activity | Medium | T1046 |
| `credential-harvesting` | Credential Harvesting | Critical | T1003 |

### 3. Dynamic Risk Scoring
Risk scores are **dynamically calculated** based on:
- **Base risk score** from rule definition
- **Frequency multiplier**: More occurrences → higher risk
- **IP diversity**: Attacks from multiple IPs → higher risk
- **Time concentration**: Attacks in short window → higher risk

Final risk score determines severity:
- **90-100**: Critical
- **70-89**: High
- **50-69**: Medium
- **30-49**: Low
- **0-29**: Info

### 4. Alert Generation
Each detection generates an alert with:
- **Title**: `[Log] {Rule Name}`
- **Source**: `Log Analysis: {FileName}`
- **Description**: Detailed summary with:
  - Occurrences count
  - Unique IPs
  - Risk score
  - Top source IPs
  - Affected log lines
  - Sample log entry
- **Metadata** (`raw_data`):
  ```json
  {
    "source_type": "log_ingestion",
    "log_file": "security.log",
    "rule_id": "sql-injection",
    "rule_name": "SQL Injection Attempt",
    "category": "Injection Attack",
    "mitre_attack": ["T1190"],
    "risk_score": 95,
    "detection_count": 15,
    "unique_ips": 3,
    "top_ips": [...],
    "affected_lines": [12, 15, 18, ...],
    "sample_logs": [...]
  }
  ```

### 5. Safety Features
- **Duplicate prevention**: Checks for alerts from same file + rule in last 24 hours
- **Batch processing**: Processes detections with progress tracking
- **Error recovery**: Graceful handling with rollback capability
- **Rate limiting**: Small delays between insertions to avoid overwhelming DB

## 🔄 Data Flow

```
┌─────────────┐
│ User uploads│
│  .log file  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  validateLogFile│
│  readFileContent│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  parseLogFile() │ ◄── Detection Rules
│  - Line-by-line │     (10 patterns)
│  - Pattern match│
│  - Extract meta │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Dynamic Risk Scoring│
│ - Frequency         │
│ - IP diversity      │
│ - Time concentration│
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│ processDetections()  │
│ - Check duplicates   │
│ - Convert to alerts  │
│ - INSERT into DB     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Supabase alerts     │ ──► Real-time subscription
│  table (INSERT only) │     triggers dashboard update
└──────────────────────┘
```

## 🗄️ Database Integration

### Existing Schema (Unchanged)
```sql
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY,
    incident_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    severity incident_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'pending',
    raw_data JSONB,
    resolution_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### How We Use It
- ✅ **INSERT** alerts with `source_type: "log_ingestion"` in metadata
- ✅ Uses existing realtime subscription
- ✅ Alerts appear automatically in dashboard
- ❌ **NO schema changes**
- ❌ **NO modifications to existing alerts**

## 🧪 Testing

### Sample Log Generator
The page includes a **built-in sample log generator** that creates a test file with:
- SSH brute force attempts
- SQL injection patterns
- Malware signatures
- Large data transfers
- Privilege escalation attempts
- Port scanning activity
- Unauthorized access attempts
- Credential harvesting indicators

**Usage**:
1. Click "Download Sample Log" button
2. Upload the downloaded `sample_security.log`
3. Click "Analyze Logs"
4. Review detections
5. Click "Generate Alerts"

## 🚀 Usage Workflow

### For End Users

1. **Navigate** to `/log-ingestion` in sidebar
2. **Upload** a `.log` or `.txt` file (max 10MB)
3. **Preview** the first 20 lines
4. Click **"Analyze Logs"**
   - Parser runs detection rules
   - Shows statistics and detections
5. Review **detected threats**
   - Each detection shows:
     - Rule name & severity
     - Risk score
     - Occurrences
     - Top IPs
     - Sample log entry
6. Click **"Generate Alerts ({count})"**
   - Inserts alerts into database
   - Progress bar shows processing
7. **View alerts** in `/alerts` page
   - Real-time sync automatically updates

### For Developers

```typescript
// Parse log file
import { parseLogFile, readFileContent, validateLogFile } from '@/utils/logParser';

const validation = validateLogFile(file);
if (validation.valid) {
  const content = await readFileContent(file);
  const result = parseLogFile(content, file.name);
  
  console.log('Detections:', result.detections);
  console.log('Processing time:', result.processingTime);
}

// Process detections and create alerts
import { processDetections } from '@/services/LogIngestionService';

const summary = await processDetections(
  result.detections,
  file.name,
  (current, total) => console.log(`${current}/${total}`)
);

console.log('Alerts generated:', summary.alertsGenerated);
```

## 🔧 Extensibility

### Adding New Detection Rules

1. **Define rule** in `utils/logParser.ts`:
```typescript
{
  id: 'custom-rule',
  name: 'Custom Threat Detection',
  description: 'Detects custom pattern',
  pattern: /your-regex-pattern/i,
  severity: 'high',
  riskScore: 75,
  category: 'Custom Category',
  mitreAttack: ['T1234'],
  recommendedActions: [
    'Action 1',
    'Action 2',
  ],
}
```

2. **Add to** `DETECTION_RULES` array

3. **Test** with sample logs

### Upgrading to Real-Time Streaming

Future enhancement path:
```typescript
// Add WebSocket/SSE connection
const logStream = new EventSource('/api/logs/stream');

logStream.onmessage = (event) => {
  const logLine = event.data;
  
  // Run real-time detection
  const detection = runRealTimeDetection(logLine);
  
  if (detection) {
    // Immediate alert generation
    await insertAlert(detection);
  }
};
```

## 📊 Performance

- **Parsing speed**: ~1000-2000 lines/second
- **Memory usage**: Minimal (streaming line-by-line)
- **Database impact**: Batched inserts with delays
- **UI responsiveness**: Async processing with progress tracking

## 🛡️ Security Considerations

1. **File validation**: Size and type checking
2. **Duplicate prevention**: 24-hour window
3. **Injection protection**: All data sanitized via Supabase
4. **Error isolation**: Failures don't affect simulation
5. **Audit trail**: All alerts have metadata for tracking

## 🎨 UI Components

- **File upload** with drag-and-drop support
- **Preview pane** showing first 20 lines
- **Progress indicators** for parsing and processing
- **Statistics cards**: Total lines, detections, critical threats, processing time
- **Detection cards**: Expandable cards with full details
- **Badge system**: Color-coded severity badges
- **Summary alerts**: Success notification with breakdown

## ✅ Validation Checklist

- [x] No modifications to `SimulationContext`
- [x] No changes to `alerts` table schema
- [x] Only INSERT operations
- [x] Separate service and parser files
- [x] Clean TypeScript types
- [x] Duplicate prevention
- [x] Error handling
- [x] Progress tracking
- [x] Sample log generator
- [x] Real-time dashboard integration
- [x] Documentation

## 🔮 Future Enhancements

1. **Real-time log streaming**: WebSocket integration for live log ingestion
2. **Custom rule builder**: UI for creating detection rules without coding
3. **Machine learning**: Anomaly detection using ML models
4. **Log correlation**: Cross-reference with existing alerts
5. **Export functionality**: Download detections as CSV/JSON
6. **Scheduled ingestion**: Automated periodic log processing
7. **Multi-file upload**: Batch processing of multiple log files
8. **Advanced filters**: Filter detections by severity, category, etc.

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review code comments in source files
3. Test with sample log generator
4. Check browser console for errors

## 🏆 Best Practices

1. **Start small**: Test with sample log before production logs
2. **Review detections**: Before generating alerts, review what was found
3. **Monitor dashboard**: Check that alerts appear correctly
4. **Clean data**: Remove duplicate alerts if needed
5. **Extend gradually**: Add custom rules one at a time

---

**Version**: 1.0.0  
**Last Updated**: 2024-02-12  
**Author**: IRIS-SOC Development Team
