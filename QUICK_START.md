# 🚀 Quick Start Guide - Log Ingestion Feature

## ⚡ 5-Minute Quick Test

### Step 1: Start the Application
```bash
cd "d:\major project demo simulation\incident-commander-hub-main"
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### Step 2: Access Log Ingestion
1. Open browser to `http://localhost:5173`
2. Log in to your IRIS-SOC dashboard
3. In sidebar, click **"Log Ingestion"** (between Evidence and Playbooks)

### Step 3: Generate Sample Log
1. Click the **"Download Sample Log"** button (top right)
2. A file `sample_security.log` will download
3. This file contains realistic security events for testing

### Step 4: Upload and Analyze
1. Click **"Select File"** button
2. Choose the downloaded `sample_security.log`
3. See preview of first 20 lines
4. Click **"Analyze Logs"** button
5. Watch the progress bar (should take 1-2 seconds)

### Step 5: Review Detections
You should see approximately **8-10 detections**:

| Detection | Severity | What It Found |
|-----------|----------|---------------|
| SSH Brute Force | High | 5 failed login attempts |
| SQL Injection | Critical | 3 injection patterns |
| Malware Signature | Critical | 3 malware detections |
| Data Exfiltration | High | 2 large transfers (GB) |
| Privilege Escalation | Critical | 2 sudo/root attempts |
| Port Scanning | Medium | 2 nmap scans |
| Unauthorized Access | Medium | 3 denied access attempts |
| Credential Harvesting | Critical | 2 mimikatz/lsass events |

### Step 6: Generate Alerts
1. Click **"Generate Alerts (X)"** button (where X is the detection count)
2. Watch progress as alerts are created
3. See success message with breakdown:
   - Critical alerts: ~4
   - High alerts: ~2
   - Medium alerts: ~2

### Step 7: Verify in Dashboard
1. Navigate to **"Alerts"** page in sidebar
2. You should see new alerts with `[Log]` prefix
3. Example: `[Log] SQL Injection Attempt`
4. Click any alert to see full details including:
   - Risk score
   - Top source IPs
   - Affected log lines
   - Sample log entries
   - Recommended actions

## ✅ Success Indicators

After completing the quick test, you should see:

- ✅ 8-10 new alerts in the Alerts page
- ✅ Each alert has source: "Log Analysis: sample_security.log"
- ✅ Alerts have severity badges (red for Critical, orange for High, yellow for Medium)
- ✅ No errors in browser console
- ✅ Real-time updates (alerts appear immediately)

## 🧪 Testing With Your Own Logs

### Supported Log Formats

Any `.log` or `.txt` file containing text logs with patterns like:

**SSH/Auth Logs:**
```
Feb 12 10:15:23 server sshd[1234]: Failed password for admin from 10.0.0.1
Feb 12 10:15:25 server sshd[1234]: authentication failure for user root
```

**Web Server Logs:**
```
2024-02-12 10:20:15 [WEB] GET /search?q=' OR 1=1-- from 192.168.1.100
2024-02-12 10:20:18 [WEB] POST /login?username=admin' OR '1'='1
```

**Security Event Logs:**
```
[2024-02-12 10:25:00] [AV] Detected ransomware signature in file.exe
[2024-02-12 10:25:05] [EDR] Trojan.Generic found on WORKSTATION-05
```

**Firewall/Network Logs:**
```
2024-02-12 10:30:00 [FIREWALL] Outbound: 5.2 GB transferred to 104.24.104.24
2024-02-12 10:40:00 [IDS] Port scan detected from 192.0.2.100
```

### Upload Process

1. **Navigate** to `/log-ingestion`
2. **Select** your `.log` or `.txt` file (max 10MB)
3. **Preview** first 20 lines to verify format
4. **Analyze** to run detection rules
5. **Review** detections before generating alerts
6. **Generate** alerts when satisfied

### Best Practices

✅ **DO:**
- Start with small log files (< 1MB) for testing
- Review detections before generating alerts
- Check for duplicates if re-uploading same file
- Monitor dashboard to see alerts appear

❌ **DON'T:**
- Upload files larger than 10MB (will be rejected)
- Generate alerts without reviewing detections first
- Upload the same file multiple times (duplicates are prevented)
- Expect non-security logs to trigger detections

## 🎯 What Each Detection Rule Finds

| Rule | Pattern Example | Risk Score |
|------|-----------------|------------|
| **SSH Brute Force** | "failed password", "authentication failure" | 75-85 |
| **SQL Injection** | `' OR 1=1`, `UNION SELECT`, `DROP TABLE` | 95-100 |
| **Malware Signature** | "malware", "virus", "trojan", "ransomware" | 98-100 |
| **Data Exfiltration** | "5.2 GB transferred", "3500 MB sent" | 70-80 |
| **Privilege Escalation** | "sudo su root", "privilege escalation" | 90-100 |
| **Port Scanning** | "port scan", "nmap", "reconnaissance" | 65-75 |
| **Credential Harvesting** | "mimikatz", "lsass", "hashdump" | 92-100 |
| **Unauthorized Access** | "403 forbidden", "401 unauthorized" | 50-60 |
| **Suspicious IP** | Patterns matching known bad IP ranges | 60-70 |
| **Excessive Requests** | Multiple HTTP requests from same IP | 55-65 |

*Risk scores increase based on frequency, IP diversity, and time concentration*

## 🔧 Troubleshooting

### File Upload Issues

**Problem**: "Invalid file type"  
**Solution**: Only `.log` and `.txt` files are supported. Rename your file if needed.

**Problem**: "File too large"  
**Solution**: Maximum file size is 10MB. Split larger files or filter to recent logs.

**Problem**: "File is empty"  
**Solution**: Ensure the log file contains actual content.

### Parsing Issues

**Problem**: No detections found  
**Solution**: The log file may not contain patterns matching the detection rules. Try the sample log first to verify the system works.

**Problem**: Parsing takes too long  
**Solution**: Large files may take longer. Check browser console for progress. Consider splitting the file.

### Alert Generation Issues

**Problem**: "Database connection failed"  
**Solution**: Check that Supabase is running and your `.env` file has correct credentials.

**Problem**: Duplicate alerts not prevented  
**Solution**: Duplicate detection works on a 24-hour window. Alerts with the same rule+filename are blocked.

**Problem**: Alerts not appearing in dashboard  
**Solution**: 
1. Check browser console for errors
2. Verify real-time subscription is active
3. Refresh the Alerts page
4. Check Supabase dashboard to see if alerts were inserted

## 📊 Understanding Results

### Statistics Cards

**Total Lines**: Number of lines processed from log file  
**Detections**: Number of threat patterns found  
**Critical Threats**: Detections with risk score ≥ 90  
**Processing Time**: Milliseconds to analyze the log

### Detection Cards

Each detection shows:
- **Rule Name**: What threat pattern was matched
- **Severity Badge**: Color-coded (Critical=red, High=orange, Medium=yellow, Low=blue)
- **Risk Score**: Dynamic score from 0-100
- **Occurrences**: How many times the pattern appeared
- **Unique IPs**: Number of distinct IP addresses involved
- **Category**: Threat category (e.g., "Injection Attack")
- **MITRE ATT&CK**: Relevant technique IDs
- **Top Source IPs**: Most frequent IP addresses with count
- **Sample Log Entry**: Example line that triggered detection

### Processing Summary

After generating alerts:
- **Alerts Generated**: Total created
- **Critical/High/Medium/Low**: Breakdown by severity
- **Processing Time**: Time to insert all alerts

## 🎓 Next Steps

### After Quick Test

1. ✅ **Try your own logs**: Upload real security logs from your systems
2. ✅ **Customize rules**: Edit `src/utils/logParser.ts` to add domain-specific patterns
3. ✅ **Monitor dashboard**: Watch how alerts integrate with existing workflow
4. ✅ **Test correlation**: See if log-based alerts can be escalated to incidents

### Advanced Usage

- **Add custom rules**: See `LOG_INGESTION_README.md` for rule creation guide
- **Integrate with SIEM**: Export detections or correlate with other data
- **Automate ingestion**: Build scheduled log processing
- **Extend to streaming**: Implement real-time log tailing

## 📚 Additional Resources

- **Full Documentation**: `LOG_INGESTION_README.md`
- **Architecture Diagrams**: `ARCHITECTURE_DIAGRAMS.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Test Utilities**: `src/utils/testLogIngestion.ts`

## 💬 Support

If you encounter issues:

1. Check browser console for error messages
2. Review the troubleshooting section above
3. Verify your `.env` configuration
4. Test with the sample log first
5. Check that alerts table exists in Supabase

## 🎉 You're All Set!

The log ingestion feature is now ready to use. Start with the sample log to verify everything works, then upload your own security logs to begin automated threat detection.

**Happy hunting! 🔍🛡️**

---

**Quick Reference**:
- Page: `/log-ingestion`
- Max file size: 10MB
- Supported formats: `.log`, `.txt`
- Detection rules: 10
- Duplicate window: 24 hours
- Real-time updates: Automatic
