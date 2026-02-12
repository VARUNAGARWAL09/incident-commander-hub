import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Target, 
  Search, 
  Shield, 
  Eye,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Grid3X3,
  Copy,
  BookOpen,
  Crosshair,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { mitreTactics, MitreTactic, MitreTechnique, getAllTechniques, getTacticById } from '@/data/mitreAttack';

const TacticColumn = ({ 
  tactic, 
  onSelectTechnique,
  highlightedTechniques,
  selectedTactic,
  onSelectTactic
}: { 
  tactic: MitreTactic; 
  onSelectTechnique: (technique: MitreTechnique) => void;
  highlightedTechniques: string[];
  selectedTactic: string | null;
  onSelectTactic: (tacticId: string | null) => void;
}) => {
  const isSelected = selectedTactic === tactic.id;
  
  return (
    <div className="min-w-[160px] max-w-[160px] flex flex-col shrink-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => onSelectTactic(isSelected ? null : tactic.id)}
              className={`p-3 rounded-t-lg text-center transition-all ${
                isSelected 
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                  : 'bg-primary/80 text-primary-foreground hover:bg-primary'
              }`}
            >
              <div className="font-semibold text-xs truncate">{tactic.shortName}</div>
              <div className="text-[10px] opacity-80">{tactic.id}</div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs z-50 bg-popover text-popover-foreground">
            <p className="font-medium">{tactic.name}</p>
            <p className="text-xs text-muted-foreground">{tactic.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className={`flex-1 rounded-b-lg p-1.5 space-y-1.5 transition-all ${
        isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50'
      }`}>
        {tactic.techniques.map(technique => {
          const isHighlighted = highlightedTechniques.includes(technique.id);
          return (
            <TooltipProvider key={technique.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectTechnique(technique)}
                    className={`w-full text-left p-2 rounded text-xs transition-all ${
                      isHighlighted 
                        ? 'bg-destructive text-destructive-foreground shadow-md' 
                        : 'bg-card text-card-foreground hover:bg-accent hover:shadow-sm border border-border'
                    }`}
                  >
                    <div className="font-medium truncate">{technique.name}</div>
                    <div className={isHighlighted ? 'text-destructive-foreground/70' : 'text-muted-foreground'}>
                      {technique.id}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm z-50 bg-popover text-popover-foreground">
                  <p className="font-medium">{technique.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{technique.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

const TechniqueDetail = ({ 
  technique, 
  open, 
  onOpenChange 
}: { 
  technique: MitreTechnique | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  if (!technique) return null;
  
  const tactic = getTacticById(technique.tacticId);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {technique.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => copyToClipboard(technique.id, 'Technique ID')}
            >
              <Copy className="h-3 w-3 mr-1" />
              {technique.id}
            </Badge>
            {tactic && (
              <Badge variant="secondary">
                <Crosshair className="h-3 w-3 mr-1" />
                {tactic.name}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Description
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{technique.description}</p>
          </div>
          
          <div className="p-4 bg-chart-1/10 rounded-lg border border-chart-1/20">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-chart-1">
              <Eye className="h-4 w-4" />
              Detection Methods
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{technique.detection}</p>
          </div>
          
          <div className="p-4 bg-chart-2/10 rounded-lg border border-chart-2/20">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-chart-2">
              <Shield className="h-4 w-4" />
              Mitigation Strategies
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{technique.mitigation}</p>
          </div>
          
          <div className="pt-4 border-t flex items-center justify-between">
            <Button variant="outline" className="gap-2" asChild>
              <a 
                href={`https://attack.mitre.org/techniques/${technique.id}/`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View on MITRE ATT&CK
              </a>
            </Button>
            <Button 
              variant="secondary" 
              className="gap-2"
              onClick={() => {
                copyToClipboard(
                  `${technique.id}: ${technique.name}\n\nDescription: ${technique.description}\n\nDetection: ${technique.detection}\n\nMitigation: ${technique.mitigation}`,
                  'Technique details'
                );
              }}
            >
              <Copy className="h-4 w-4" />
              Copy Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TechniqueListItem = ({
  technique,
  onClick,
  isHighlighted
}: {
  technique: MitreTechnique;
  onClick: () => void;
  isHighlighted: boolean;
}) => {
  const tactic = getTacticById(technique.tacticId);
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isHighlighted 
          ? 'border-destructive bg-destructive/5 hover:border-destructive' 
          : 'hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{technique.name}</span>
              {isHighlighted && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  DETECTED
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{technique.id}</Badge>
              {tactic && (
                <Badge variant="secondary" className="text-xs">{tactic.shortName}</Badge>
              )}
            </div>
          </div>
          <Target className={`h-5 w-5 ${isHighlighted ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {technique.description}
        </p>
      </CardContent>
    </Card>
  );
};

const TacticInfo = ({ tactic, onClose }: { tactic: MitreTactic; onClose: () => void }) => {
  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            {tactic.name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{tactic.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{tactic.description}</p>
        <div>
          <h4 className="text-sm font-medium mb-2">Techniques ({tactic.techniques.length})</h4>
          <div className="flex flex-wrap gap-1">
            {tactic.techniques.map(tech => (
              <Badge key={tech.id} variant="outline" className="text-xs">
                {tech.id}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MitreMapping() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [highlightedTechniques, setHighlightedTechniques] = useState<string[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  
  const allTechniques = getAllTechniques();
  
  const filteredTechniques = allTechniques.filter(tech => 
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectTechnique = (technique: MitreTechnique) => {
    setSelectedTechnique(technique);
    setDialogOpen(true);
  };
  
  const toggleHighlight = (techId: string) => {
    setHighlightedTechniques(prev => 
      prev.includes(techId) 
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };
  
  // Example detected techniques
  const exampleDetectedTechniques = ['T1566', 'T1059', 'T1078', 'T1021'];
  
  const selectedTacticData = selectedTactic ? getTacticById(selectedTactic) : null;
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              MITRE ATT&CK Mapping
            </h1>
            <p className="text-muted-foreground">
              Interactive framework for mapping threats to tactics and techniques
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Grid3X3 className="h-3 w-3" />
              {mitreTactics.length} Tactics
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              {allTechniques.length} Techniques
            </Badge>
            {highlightedTechniques.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {highlightedTechniques.length} Detected
              </Badge>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="matrix" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="matrix" className="gap-2">
                <Grid3X3 className="h-4 w-4" />
                Matrix View
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <Target className="h-4 w-4" />
                Technique List
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={highlightedTechniques.length > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (highlightedTechniques.length > 0) {
                    setHighlightedTechniques([]);
                    toast.info('Highlights cleared');
                  } else {
                    setHighlightedTechniques(exampleDetectedTechniques);
                    toast.success(`${exampleDetectedTechniques.length} techniques highlighted`);
                  }
                }}
              >
                {highlightedTechniques.length > 0 ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Clear Highlights
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Show Detected
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <TabsContent value="matrix" className="space-y-4">
            {selectedTacticData && (
              <TacticInfo 
                tactic={selectedTacticData} 
                onClose={() => setSelectedTactic(null)} 
              />
            )}
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>ATT&CK Matrix for Enterprise</CardTitle>
                <CardDescription>
                  Click tactics to see details • Click techniques to view detection and mitigation info
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto overflow-y-visible">
                  <div className="flex gap-2 p-6 pt-0" style={{ minWidth: 'max-content' }}>
                    {mitreTactics.map(tactic => (
                      <TacticColumn 
                        key={tactic.id} 
                        tactic={tactic} 
                        onSelectTechnique={handleSelectTechnique}
                        highlightedTechniques={highlightedTechniques}
                        selectedTactic={selectedTactic}
                        onSelectTactic={setSelectedTactic}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {highlightedTechniques.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Detected Techniques in Your Environment
                  </CardTitle>
                  <CardDescription>
                    Click on a technique to view details or remove from highlights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {highlightedTechniques.map(techId => {
                      const tech = allTechniques.find(t => t.id === techId);
                      return tech ? (
                        <Badge 
                          key={techId}
                          variant="destructive" 
                          className="cursor-pointer hover:bg-destructive/80 gap-1"
                          onClick={() => handleSelectTechnique(tech)}
                        >
                          {tech.id}: {tech.name}
                          <button 
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHighlight(techId);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search techniques by name, ID, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">
                {filteredTechniques.length} techniques
              </Badge>
            </div>
            
            {filteredTechniques.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-1">No techniques found</h3>
                  <p className="text-muted-foreground">Try adjusting your search query</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTechniques.map(technique => (
                  <TechniqueListItem
                    key={technique.id}
                    technique={technique}
                    onClick={() => handleSelectTechnique(technique)}
                    isHighlighted={highlightedTechniques.includes(technique.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <TechniqueDetail 
          technique={selectedTechnique}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </MainLayout>
  );
}
