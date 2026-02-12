import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Zap,
  Search,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Hash,
  Network,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EnrichmentModule {
  id: string;
  name: string;
  description: string;
  type: 'ip' | 'hash' | 'url' | 'domain' | 'all';
  enabled: boolean;
  status: 'active' | 'error' | 'pending';
}

interface EnrichmentResultData {
  module: string;
  status: 'success' | 'error' | 'no_data';
  data: Record<string, unknown>;
  summary: string;
}

interface EnrichmentResponse {
  indicator: string;
  indicatorType: string;
  timestamp: string;
  results: EnrichmentResultData[];
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  overallSummary: string;
  error?: string;
}

const defaultModules: EnrichmentModule[] = [
  { id: '1', name: 'VirusTotal', description: 'File hash and URL analysis', type: 'all', enabled: true, status: 'active' },
  { id: '2', name: 'AbuseIPDB', description: 'IP reputation database', type: 'ip', enabled: true, status: 'active' },
  { id: '3', name: 'URLScan.io', description: 'Website scanning and analysis', type: 'url', enabled: true, status: 'active' },
  { id: '4', name: 'Shodan', description: 'Internet-connected device intelligence', type: 'ip', enabled: true, status: 'active' },
  { id: '5', name: 'AlienVault OTX', description: 'Open threat intelligence', type: 'all', enabled: true, status: 'active' },
  { id: '6', name: 'Hybrid Analysis', description: 'Malware analysis sandbox', type: 'hash', enabled: true, status: 'active' },
];

const STORAGE_KEY = 'enrichment-modules';

const Enrichment = () => {
  const [indicator, setIndicator] = useState('');
  const [indicatorType, setIndicatorType] = useState<'auto' | 'ip' | 'hash' | 'url' | 'domain'>('auto');
  const [isEnriching, setIsEnriching] = useState(false);
  const [modules, setModules] = useState<EnrichmentModule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultModules;
  });
  const [results, setResults] = useState<EnrichmentResponse | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('enrichment-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('enrichment-history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const getEnabledModulesForType = (type: string) => {
    return modules.filter(m =>
      m.enabled && (m.type === 'all' || m.type === type)
    );
  };

  const handleEnrich = async () => {
    if (!indicator.trim()) {
      toast.error('Please enter an indicator to enrich');
      return;
    }

    const enabledModules = modules.filter(m => m.enabled);
    if (enabledModules.length === 0) {
      toast.error('Please enable at least one enrichment module');
      return;
    }

    setIsEnriching(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-indicator', {
        body: {
          indicator: indicator.trim(),
          indicatorType,
          modules: enabledModules.map(m => m.name),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data);

      // Add to search history
      if (!searchHistory.includes(indicator.trim())) {
        setSearchHistory(prev => [indicator.trim(), ...prev.slice(0, 9)]);
      }

      toast.success(`Enrichment complete for ${data.indicatorType}: ${indicator}`);
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enrich indicator');
    } finally {
      setIsEnriching(false);
    }
  };

  const toggleExpandModule = (moduleName: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ip': return Network;
      case 'hash': return Hash;
      case 'url': return Globe;
      case 'domain': return Globe;
      default: return Zap;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-status-resolved/10 text-status-resolved border-status-resolved/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-severity-critical/10 text-severity-critical border-severity-critical/30 gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return (
          <Badge className="bg-severity-critical text-white gap-1">
            <ShieldAlert className="h-3 w-3" />
            Critical Risk
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-severity-high text-white gap-1">
            <AlertTriangle className="h-3 w-3" />
            High Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-severity-medium text-black gap-1">
            <Shield className="h-3 w-3" />
            Medium Risk
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-severity-low text-black gap-1">
            <Shield className="h-3 w-3" />
            Low Risk
          </Badge>
        );
      case 'clean':
        return (
          <Badge className="bg-status-resolved text-white gap-1">
            <ShieldCheck className="h-3 w-3" />
            Clean
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderDataValue = (key: string, value: unknown, parentKey = ''): React.ReactNode => {
    const fieldId = parentKey ? `${parentKey}.${key}` : key;

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">N/A</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="outline" className="bg-status-resolved/10 text-status-resolved">Yes</Badge>
      ) : (
        <Badge variant="outline" className="bg-muted">No</Badge>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground">None</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 5).map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Badge>
          ))}
          {value.length > 5 && (
            <Badge variant="outline" className="text-xs">+{value.length - 5} more</Badge>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="space-y-1 pl-4 border-l border-border">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground min-w-[100px]">{k}:</span>
              {renderDataValue(k, v, fieldId)}
            </div>
          ))}
        </div>
      );
    }

    const stringValue = String(value);
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{stringValue}</span>
        <button
          onClick={() => copyToClipboard(stringValue, fieldId)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {copiedField === fieldId ? (
            <Check className="h-3 w-3 text-status-resolved" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-2xl font-bold tracking-tight"
            >
              Indicator Enrichment
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Enrich indicators of compromise with AI-powered threat intelligence
            </motion.p>
          </div>
        </div>

        {/* Enrichment Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-6"
        >
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
            Enrich Indicator
          </h3>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter IP, hash, URL, or domain..."
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnrich()}
                className="pl-9 bg-secondary/50 font-mono"
                list="search-history"
              />
              <datalist id="search-history">
                {searchHistory.map((item, i) => (
                  <option key={i} value={item} />
                ))}
              </datalist>
            </div>

            <Select
              value={indicatorType}
              onValueChange={(value) => setIndicatorType(value as typeof indicatorType)}
            >
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="hash">File Hash</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleEnrich}
              disabled={!indicator.trim() || isEnriching}
              className="gap-2"
            >
              {isEnriching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Enrich
                </>
              )}
            </Button>
          </div>

          {searchHistory.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Recent:</span>
              {searchHistory.slice(0, 5).map((item, i) => (
                <button
                  key={i}
                  onClick={() => setIndicator(item)}
                  className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded hover:bg-secondary transition-colors"
                >
                  {item.length > 30 ? item.slice(0, 30) + '...' : item}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Summary Card */}
              <div className="rounded-xl border bg-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-mono text-lg font-semibold">{results.indicator}</h3>
                      <Badge variant="outline" className="uppercase text-xs">
                        {results.indicatorType}
                      </Badge>
                      {getRiskBadge(results.riskLevel)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enriched at {new Date(results.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={cn(
                        "text-3xl font-bold font-mono",
                        results.riskScore >= 70 ? "text-severity-critical" :
                          results.riskScore >= 50 ? "text-severity-high" :
                            results.riskScore >= 30 ? "text-severity-medium" :
                              results.riskScore >= 10 ? "text-severity-low" :
                                "text-status-resolved"
                      )}>
                        {results.riskScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Risk Score</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm">{results.overallSummary}</p>
              </div>

              {/* Module Results */}
              <div className="space-y-3">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
                  Module Results ({results.results.length})
                </h3>

                {results.results.map((result, index) => (
                  <motion.div
                    key={result.module}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpandModule(result.module)}
                      className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "rounded-lg p-2",
                          result.status === 'success' ? 'bg-status-resolved/10' :
                            result.status === 'error' ? 'bg-severity-critical/10' :
                              'bg-muted'
                        )}>
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-status-resolved" />
                          ) : result.status === 'error' ? (
                            <XCircle className="h-4 w-4 text-severity-critical" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{result.module}</p>
                          <p className="text-sm text-muted-foreground">{result.summary}</p>
                        </div>
                      </div>
                      {expandedModules.has(result.module) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedModules.has(result.module) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t"
                        >
                          <ScrollArea className="max-h-[400px]">
                            <div className="p-4 space-y-2">
                              {Object.entries(result.data).map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2 py-1">
                                  <span className="text-sm text-muted-foreground min-w-[140px] capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <div className="flex-1">{renderDataValue(key, value)}</div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
              Enrichment Modules
            </h3>
            <span className="text-xs text-muted-foreground">
              {modules.filter(m => m.enabled).length} of {modules.length} enabled
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {modules.map((module, index) => {
              const TypeIcon = getTypeIcon(module.type === 'all' ? 'domain' : module.type);

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  className={cn(
                    'group rounded-xl border bg-card p-5 transition-all',
                    module.enabled ? 'hover:border-primary/30' : 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'rounded-lg p-2.5',
                        module.enabled ? 'bg-primary/10' : 'bg-secondary'
                      )}>
                        <TypeIcon className={cn(
                          'h-5 w-5',
                          module.enabled ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{module.name}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] uppercase">
                          {module.type === 'all' ? 'All Types' : module.type}
                        </Badge>
                      </div>
                    </div>
                    {getStatusBadge(module.status)}
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {module.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={module.enabled}
                        onCheckedChange={() => toggleModule(module.id)}
                        id={`module-${module.id}`}
                      />
                      <label
                        htmlFor={`module-${module.id}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {module.enabled ? 'Enabled' : 'Disabled'}
                      </label>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        const urls: Record<string, string> = {
                          'VirusTotal': 'https://www.virustotal.com',
                          'AbuseIPDB': 'https://www.abuseipdb.com',
                          'URLScan.io': 'https://urlscan.io',
                          'Shodan': 'https://www.shodan.io',
                          'AlienVault OTX': 'https://otx.alienvault.com',
                          'Hybrid Analysis': 'https://www.hybrid-analysis.com',
                        };
                        window.open(urls[module.name] || '#', '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Enrichment;
