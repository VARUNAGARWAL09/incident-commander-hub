import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, AlertTriangle, Users, Zap } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useIncidents } from '@/context/IncidentsContext';
import { SeverityBadge } from '@/components/ui/SeverityBadge';

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { incidents } = useIncidents();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (value: string) => {
    setOpen(false);
    
    if (value.startsWith('incident:')) {
      navigate('/incidents');
    } else if (value.startsWith('page:')) {
      const page = value.replace('page:', '');
      navigate(page);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex-1 min-w-[240px] max-w-[320px]"
      >
        <div className="flex items-center h-9 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary/70 transition-colors">
          <Search className="h-4 w-4 mr-2" />
          <span>Search incidents, evidence...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search incidents, pages, evidence..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => handleSelect('page:/')}>
              <FileText className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('page:/incidents')}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Incidents
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('page:/alerts')}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alerts
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('page:/evidence')}>
              <FileText className="mr-2 h-4 w-4" />
              Evidence
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('page:/enrichment')}>
              <Zap className="mr-2 h-4 w-4" />
              Enrichment
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('page:/team')}>
              <Users className="mr-2 h-4 w-4" />
              Team
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Recent Incidents">
            {incidents.slice(0, 5).map((incident) => (
              <CommandItem
                key={incident.id}
                onSelect={() => handleSelect(`incident:${incident.id}`)}
                className="flex items-center gap-2"
              >
                <SeverityBadge severity={incident.severity} size="sm" />
                <span className="font-mono text-xs text-muted-foreground">
                  {incident.case_number}
                </span>
                <span className="truncate">{incident.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}