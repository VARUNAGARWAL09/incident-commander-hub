import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrichmentRequest {
  indicator: string;
  indicatorType: "ip" | "hash" | "url" | "domain" | "auto";
  modules: string[];
}

interface EnrichmentResult {
  module: string;
  status: "success" | "error" | "no_data";
  data: Record<string, unknown>;
  summary: string;
}

function detectIndicatorType(indicator: string): "ip" | "hash" | "url" | "domain" {
  // IPv4 pattern
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(indicator)) {
    return "ip";
  }
  // IPv6 pattern (simplified)
  if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(indicator)) {
    return "ip";
  }
  // URL pattern
  if (/^https?:\/\//i.test(indicator)) {
    return "url";
  }
  // MD5 hash
  if (/^[a-fA-F0-9]{32}$/.test(indicator)) {
    return "hash";
  }
  // SHA-1 hash
  if (/^[a-fA-F0-9]{40}$/.test(indicator)) {
    return "hash";
  }
  // SHA-256 hash
  if (/^[a-fA-F0-9]{64}$/.test(indicator)) {
    return "hash";
  }
  // Domain pattern
  if (/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(indicator)) {
    return "domain";
  }
  // Default to domain
  return "domain";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { indicator, indicatorType, modules } = (await req.json()) as EnrichmentRequest;

    if (!indicator || !modules || modules.length === 0) {
      return new Response(
        JSON.stringify({ error: "Indicator and modules are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detectedType = indicatorType === "auto" ? detectIndicatorType(indicator) : indicatorType;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Create a prompt for the AI to simulate threat intelligence lookup
    const systemPrompt = `You are a threat intelligence analyst providing enrichment data for security indicators. 
You will analyze the given indicator and provide realistic threat intelligence data as if querying real security services.
For each module requested, provide detailed, realistic data in JSON format.

Respond ONLY with valid JSON in this exact format:
{
  "results": [
    {
      "module": "ModuleName",
      "status": "success" | "error" | "no_data",
      "data": { ... detailed results ... },
      "summary": "Brief one-line summary"
    }
  ],
  "indicatorType": "detected type",
  "riskScore": 0-100,
  "riskLevel": "critical" | "high" | "medium" | "low" | "clean",
  "overallSummary": "2-3 sentence threat assessment"
}

Module-specific data formats:
- VirusTotal: detection_ratio, scan_date, positives, total_engines, detected_by (array), file_type (for hashes), categories (for URLs/domains)
- AbuseIPDB: abuse_confidence_score (0-100), total_reports, last_reported, country, isp, usage_type, is_whitelisted
- URLScan.io: screenshot_url, malicious, certificates, technologies, server, ip_addresses, links_count
- Shodan: ports (array), hostnames, os, organization, isp, last_update, vulns (array)
- AlienVault OTX: pulse_count, related_pulses (array with names), tags, first_seen, last_seen
- Hybrid Analysis: verdict, threat_score, av_detect_ratio, environment, analysis_start_time, malware_family

Be realistic - sometimes indicators are clean, sometimes they have old/stale data.`;

    const userPrompt = `Analyze this indicator and provide threat intelligence data:
Indicator: ${indicator}
Detected Type: ${detectedType}
Modules to query: ${modules.join(", ")}

Provide realistic threat intelligence results for each module.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response from the AI
    let enrichmentData;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      enrichmentData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse enrichment results");
    }

    return new Response(
      JSON.stringify({
        indicator,
        indicatorType: detectedType,
        timestamp: new Date().toISOString(),
        ...enrichmentData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Enrichment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enrich indicator";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
