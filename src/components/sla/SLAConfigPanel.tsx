import { useState } from 'react';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { useToast } from '@/hooks/use-toast';
import { useSLA, type SLAConfig } from '@/hooks/useSLA';
import { useAuditLog } from '@/hooks/useAuditLog';

export function SLAConfigPanel() {
  const { slaConfigs, loading, updateSLAConfig, refetch } = useSLA();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [saving, setSaving] = useState<string | null>(null);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, Partial<SLAConfig>>>({});

  const handleChange = (id: string, field: keyof SLAConfig, value: any) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (config: SLAConfig) => {
    const updates = editedConfigs[config.id];
    if (!updates) return;

    setSaving(config.id);
    const success = await updateSLAConfig(config.id, updates);

    if (success) {
      await logAction({
        action: 'sla_config_updated',
        entityType: 'sla_config',
        entityId: config.id,
        entityName: config.name,
        details: updates,
      });

      toast({
        title: 'SLA Updated',
        description: `${config.name} has been updated.`,
      });
      setEditedConfigs((prev) => {
        const { [config.id]: _, ...rest } = prev;
        return rest;
      });
    } else {
      toast({
        title: 'Update Failed',
        description: 'Could not update SLA configuration.',
        variant: 'destructive',
      });
    }
    setSaving(null);
  };

  const getConfigValue = (config: SLAConfig, field: keyof SLAConfig) => {
    return editedConfigs[config.id]?.[field] ?? config[field];
  };

  const hasChanges = (id: string) => Object.keys(editedConfigs[id] || {}).length > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          SLA Configuration
        </CardTitle>
        <CardDescription>
          Define response time requirements for each severity level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {slaConfigs.map((config) => (
            <div
              key={config.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3 min-w-[140px]">
                <SeverityBadge severity={config.severity as any} />
                <Switch
                  checked={getConfigValue(config, 'is_active') as boolean}
                  onCheckedChange={(checked) => handleChange(config.id, 'is_active', checked)}
                />
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Acknowledge Within (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={getConfigValue(config, 'acknowledge_within_minutes') as number}
                    onChange={(e) =>
                      handleChange(config.id, 'acknowledge_within_minutes', parseInt(e.target.value) || 0)
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Resolve Within (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={getConfigValue(config, 'resolve_within_minutes') as number}
                    onChange={(e) =>
                      handleChange(config.id, 'resolve_within_minutes', parseInt(e.target.value) || 0)
                    }
                    className="h-9"
                  />
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleSave(config)}
                disabled={!hasChanges(config.id) || saving === config.id}
                className="gap-2"
              >
                {saving === config.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
