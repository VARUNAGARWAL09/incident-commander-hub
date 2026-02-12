import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Zap,
  User,
  AlertTriangle,
  Shield,
  Target,
  Pause,
  RotateCcw,
  Check,
  SkipForward,
  MessageSquare,
  XCircle,
  Plus
} from 'lucide-react';
import { defaultPlaybooks, Playbook, PlaybookStep, PlaybookStepStatus } from '@/data/playbooks';
import { getTechniqueById } from '@/data/mitreAttack';
import { SeverityBadge } from '@/components/ui/SeverityBadge';

interface StepState {
  status: PlaybookStepStatus;
  completedAt?: Date;
  notes: string;
}

interface ExecutionState {
  isRunning: boolean;
  startedAt?: Date;
  stepStates: Record<string, StepState>;
}

const PlaybookCard = ({
  playbook,
  onSelect
}: {
  playbook: Playbook;
  onSelect: (playbook: Playbook) => void;
}) => {
  const requiredSteps = playbook.steps.filter(s => s.required).length;
  const automatedSteps = playbook.steps.filter(s => s.actionType === 'automated').length;

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onSelect(playbook)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{playbook.name}</CardTitle>
            <CardDescription className="line-clamp-2">{playbook.description}</CardDescription>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {playbook.severity.map(sev => (
            <SeverityBadge key={sev} severity={sev as any} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{playbook.steps.length} steps</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{playbook.estimatedDuration}m</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{automatedSteps} auto</span>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {playbook.mitreTechniques.slice(0, 3).map(techId => {
            const tech = getTechniqueById(techId);
            return tech ? (
              <Badge key={techId} variant="outline" className="text-xs">
                {tech.id}
              </Badge>
            ) : null;
          })}
          {playbook.mitreTechniques.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{playbook.mitreTechniques.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StepItem = ({
  step,
  index,
  stepState,
  isExecuting,
  onComplete,
  onSkip,
  onNoteChange,
  onReset
}: {
  step: PlaybookStep;
  index: number;
  stepState: StepState;
  isExecuting: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onNoteChange: (note: string) => void;
  onReset: () => void;
}) => {
  const [showNotes, setShowNotes] = useState(false);

  const getActionIcon = () => {
    switch (step.actionType) {
      case 'automated': return <Zap className="h-4 w-4 text-chart-1" />;
      case 'decision': return <AlertTriangle className="h-4 w-4 text-chart-4" />;
      default: return <User className="h-4 w-4 text-chart-2" />;
    }
  };

  const getActionLabel = () => {
    switch (step.actionType) {
      case 'automated': return 'Automated';
      case 'decision': return 'Decision Point';
      default: return 'Manual';
    }
  };

  const getStatusIcon = () => {
    switch (stepState.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-muted-foreground" />;
      case 'in_progress':
        return <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
      default:
        return null;
    }
  };

  const isCompleted = stepState.status === 'completed';
  const isSkipped = stepState.status === 'skipped';

  return (
    <div className={`relative pl-8 pb-6 ${index !== 0 ? 'border-l-2 border-muted ml-3' : ''}`}>
      <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCompleted ? 'bg-green-500 text-white' :
        isSkipped ? 'bg-muted text-muted-foreground' :
          isExecuting ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
        {isCompleted ? <Check className="h-3 w-3" /> :
          isSkipped ? <SkipForward className="h-3 w-3" /> :
            index + 1}
      </div>

      <div className={`space-y-3 ${isSkipped ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {step.title}
            </h4>
            {step.required && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
            {getStatusIcon()}
          </div>

          {isExecuting && stepState.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onComplete}
                className="gap-1"
              >
                <Check className="h-3 w-3" />
                Complete
              </Button>
              {!step.required && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSkip}
                  className="gap-1"
                >
                  <SkipForward className="h-3 w-3" />
                  Skip
                </Button>
              )}
            </div>
          )}

          {(isCompleted || isSkipped) && isExecuting && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{step.description}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            {getActionIcon()}
            <span className="text-muted-foreground">{getActionLabel()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>~{step.estimatedMinutes} min</span>
          </div>
          {isExecuting && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 h-6 px-2"
              onClick={() => setShowNotes(!showNotes)}
            >
              <MessageSquare className="h-3 w-3" />
              Notes
            </Button>
          )}
        </div>

        {showNotes && isExecuting && (
          <Textarea
            placeholder="Add notes for this step..."
            value={stepState.notes}
            onChange={(e) => onNoteChange(e.target.value)}
            className="text-sm"
            rows={2}
          />
        )}

        {stepState.completedAt && (
          <p className="text-xs text-muted-foreground">
            Completed at {stepState.completedAt.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

const PlaybookDetail = ({
  playbook,
  onBack
}: {
  playbook: Playbook;
  onBack: () => void;
}) => {
  const [execution, setExecution] = useState<ExecutionState>({
    isRunning: false,
    stepStates: playbook.steps.reduce((acc, step) => ({
      ...acc,
      [step.id]: { status: 'pending' as PlaybookStepStatus, notes: '' }
    }), {})
  });

  const startExecution = () => {
    setExecution({
      isRunning: true,
      startedAt: new Date(),
      stepStates: playbook.steps.reduce((acc, step) => ({
        ...acc,
        [step.id]: { status: 'pending' as PlaybookStepStatus, notes: '' }
      }), {})
    });
    toast.success('Playbook execution started');
  };

  const stopExecution = () => {
    setExecution(prev => ({ ...prev, isRunning: false }));
    toast.info('Playbook execution paused');
  };

  const resetExecution = () => {
    setExecution({
      isRunning: false,
      stepStates: playbook.steps.reduce((acc, step) => ({
        ...acc,
        [step.id]: { status: 'pending' as PlaybookStepStatus, notes: '' }
      }), {})
    });
    toast.info('Playbook execution reset');
  };

  const completeStep = (stepId: string) => {
    setExecution(prev => ({
      ...prev,
      stepStates: {
        ...prev.stepStates,
        [stepId]: {
          ...prev.stepStates[stepId],
          status: 'completed',
          completedAt: new Date()
        }
      }
    }));
    toast.success('Step completed');
  };

  const skipStep = (stepId: string) => {
    setExecution(prev => ({
      ...prev,
      stepStates: {
        ...prev.stepStates,
        [stepId]: { ...prev.stepStates[stepId], status: 'skipped' }
      }
    }));
  };

  const resetStep = (stepId: string) => {
    setExecution(prev => ({
      ...prev,
      stepStates: {
        ...prev.stepStates,
        [stepId]: { status: 'pending', notes: prev.stepStates[stepId]?.notes || '' }
      }
    }));
  };

  const updateNotes = (stepId: string, notes: string) => {
    setExecution(prev => ({
      ...prev,
      stepStates: {
        ...prev.stepStates,
        [stepId]: { ...prev.stepStates[stepId], notes }
      }
    }));
  };

  const completedCount = Object.values(execution.stepStates).filter(
    s => s.status === 'completed' || s.status === 'skipped'
  ).length;
  const progress = Math.round((completedCount / playbook.steps.length) * 100);

  const isComplete = completedCount === playbook.steps.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{playbook.name}</h2>
          <p className="text-muted-foreground">{playbook.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {!execution.isRunning ? (
            <Button className="gap-2" onClick={startExecution}>
              <PlayCircle className="h-4 w-4" />
              Execute Playbook
            </Button>
          ) : (
            <>
              <Button variant="outline" className="gap-2" onClick={stopExecution}>
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button variant="destructive" className="gap-2" onClick={resetExecution}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {execution.isRunning && (
        <Card className={isComplete ? 'border-green-500 bg-green-500/5' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">
                  {isComplete ? 'Playbook Complete!' : 'Execution in Progress'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {completedCount} / {playbook.steps.length} steps completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {execution.startedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Started at {execution.startedAt.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Playbook Steps</CardTitle>
              <CardDescription>
                {playbook.steps.length} steps • ~{playbook.estimatedDuration} minutes total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playbook.steps.map((step, index) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    index={index}
                    stepState={execution.stepStates[step.id] || { status: 'pending', notes: '' }}
                    isExecuting={execution.isRunning}
                    onComplete={() => completeStep(step.id)}
                    onSkip={() => skipStep(step.id)}
                    onNoteChange={(notes) => updateNotes(step.id, notes)}
                    onReset={() => resetStep(step.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                MITRE ATT&CK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {playbook.mitreTechniques.map(techId => {
                const tech = getTechniqueById(techId);
                return tech ? (
                  <div key={techId} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium text-sm">{tech.id}</div>
                    <div className="text-sm text-muted-foreground">{tech.name}</div>
                  </div>
                ) : null;
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Applicable Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {playbook.severity.map(sev => (
                  <SeverityBadge key={sev} severity={sev as any} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Required Steps</span>
                <span className="font-medium">{playbook.steps.filter(s => s.required).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Automated Steps</span>
                <span className="font-medium">{playbook.steps.filter(s => s.actionType === 'automated').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Decision Points</span>
                <span className="font-medium">{playbook.steps.filter(s => s.actionType === 'decision').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CreatePlaybookDialog = ({ onPlaybookCreated }: { onPlaybookCreated?: (playbook: Playbook) => void }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    estimatedDuration: '30',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create a new playbook object
    const newPlaybook: Playbook = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      severity: [formData.severity],
      estimatedDuration: parseInt(formData.estimatedDuration) || 30,
      steps: [
        {
          id: 'step-1',
          order: 1,
          title: 'Initial Assessment',
          description: 'Assess the situation and gather initial information',
          actionType: 'manual',
          estimatedMinutes: 5,
          required: true
        },
        {
          id: 'step-2',
          order: 2,
          title: 'Execute Response',
          description: 'Take appropriate action based on assessment',
          actionType: 'manual',
          estimatedMinutes: 15,
          required: true
        },
        {
          id: 'step-3',
          order: 3,
          title: 'Document Results',
          description: 'Document all actions taken and results',
          actionType: 'manual',
          estimatedMinutes: 10,
          required: true
        }
      ],
      mitreTechniques: []
    };

    toast.success('Playbook created successfully!');
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      severity: 'medium',
      estimatedDuration: '30',
    });

    if (onPlaybookCreated) {
      onPlaybookCreated(newPlaybook);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Playbook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Playbook</DialogTitle>
            <DialogDescription>
              Create a custom incident response playbook with automated workflows
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Playbook Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Custom Ransomware Response"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and scope of this playbook..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="severity">Severity Level</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as any }))}
                >
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Est. Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                />
              </div>
            </div>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                💡 Your playbook will be created with 3 default steps. You can customize steps after creation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Playbook</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function Playbooks() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [customPlaybooks, setCustomPlaybooks] = useState<Playbook[]>([]);

  const handlePlaybookCreated = (newPlaybook: Playbook) => {
    setCustomPlaybooks(prev => [newPlaybook, ...prev]);
    // Optionally auto-select the new playbook
    setSelectedPlaybook(newPlaybook);
  };

  const allPlaybooks = [...customPlaybooks, ...defaultPlaybooks];

  if (selectedPlaybook) {
    return (
      <MainLayout>
        <PlaybookDetail
          playbook={selectedPlaybook}
          onBack={() => setSelectedPlaybook(null)}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Response Playbooks</h1>
            <p className="text-muted-foreground">
              Step-by-step automated workflows for incident response
            </p>
          </div>
          <CreatePlaybookDialog onPlaybookCreated={handlePlaybookCreated} />
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Playbooks</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlaybooks.map(playbook => (
                <PlaybookCard
                  key={playbook.id}
                  playbook={playbook}
                  onSelect={setSelectedPlaybook}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlaybooks
                .filter(p => p.severity.includes('critical'))
                .map(playbook => (
                  <PlaybookCard
                    key={playbook.id}
                    playbook={playbook}
                    onSelect={setSelectedPlaybook}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="high" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlaybooks
                .filter(p => p.severity.includes('high'))
                .map(playbook => (
                  <PlaybookCard
                    key={playbook.id}
                    playbook={playbook}
                    onSelect={setSelectedPlaybook}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="medium" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlaybooks
                .filter(p => p.severity.includes('medium'))
                .map(playbook => (
                  <PlaybookCard
                    key={playbook.id}
                    playbook={playbook}
                    onSelect={setSelectedPlaybook}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
