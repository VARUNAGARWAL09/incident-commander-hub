import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Users,
  Mail,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Circle,
  Loader2,
  List,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddTeamMemberDialog } from '@/components/team/AddTeamMemberDialog';

const Team = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { members, loading, refetch } = useTeamMembers();
  const { user } = useAuth();
  const { toast } = useToast();

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Remove dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const filteredUsers = members.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Active'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        `"${user.full_name}"`,
        `"${user.email}"`,
        user.role,
        user.is_online ? 'Online' : 'Offline',
        user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'team_members.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported', description: 'Team list downloaded successfully' });
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.full_name);
    setEditRole(member.role);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName, role: editRole })
        .eq('id', editingMember.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Team member updated successfully' });
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: 'Error', description: 'Failed to update team member', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (member: TeamMember) => {
    setRemovingMember(member);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', removingMember.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Team member removed successfully' });
      setRemoveDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Remove error:', error);
      toast({ title: 'Error', description: 'Failed to remove team member', variant: 'destructive' });
    } finally {
      setRemoving(false);
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary border-primary/20';
      case 'analyst': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'viewer': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (member: typeof members[0]) => {
    if (member.is_online || member.id === user?.id) return 'bg-emerald-500';
    if (member.last_active) {
      const diff = Date.now() - new Date(member.last_active).getTime();
      if (diff < 1800000) return 'bg-amber-500';
    }
    return 'bg-zinc-500';
  };

  const getLastActiveText = (member: typeof members[0]) => {
    if (member.is_online || member.id === user?.id) return 'Online now';
    if (!member.last_active) return 'Never';
    const diff = Date.now() - new Date(member.last_active).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Administration</span>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-3xl font-bold tracking-tight text-foreground"
            >
              Team Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground mt-2 text-sm max-w-xl"
            >
              Manage workspace access, assign roles, and monitor team activity.
            </motion.p>
          </div>

          <div className="flex gap-3">
            <div className="flex p-1 bg-secondary/50 rounded-lg border border-border/50">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <AddTeamMemberDialog onSuccess={refetch} />
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <h3 className="text-2xl font-bold tracking-tight">{members.length}</h3>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <h3 className="text-2xl font-bold tracking-tight">{members.filter(u => u.role === 'admin').length}</h3>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <Circle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Now</p>
                <h3 className="text-2xl font-bold tracking-tight">{members.filter(u => u.is_online || u.id === user?.id).length}</h3>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Recently</p>
                <h3 className="text-2xl font-bold tracking-tight">
                  {members.filter(m => m.last_active && (Date.now() - new Date(m.last_active).getTime() < 86400000)).length}
                </h3>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={roleFilter === 'all' ? "outline" : "secondary"} size="sm" className="hidden sm:flex gap-2">
                  <Filter className="h-4 w-4" />
                  {roleFilter === 'all' ? 'Filters' : `Role: ${roleFilter}`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('admin')}>
                  Admins
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('analyst')}>
                  Analysts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('viewer')}>
                  Viewers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-muted-foreground"
            >
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary/50" />
              <p>Loading team directory...</p>
            </motion.div>
          ) : filteredUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border bg-card/50 border-dashed"
            >
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                We couldn't find anyone matching "{searchTerm}". Try adjusting your filters.
              </p>
              <Button
                variant="link"
                onClick={() => setSearchTerm('')}
                className="mt-4 text-primary"
              >
                Clear search
              </Button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              layout
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
            >
              {filteredUsers.map((member, index) => (
                <motion.div
                  key={member.id}
                  layoutId={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b from-card to-card/95 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  {/* Header Actions */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemove(member)}
                          disabled={member.id === user?.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative mb-4">
                      <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-card",
                        getStatusColor(member)
                      )} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{member.full_name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{member.email}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className={cn("px-2.5 py-0.5 pointer-events-none", getRoleBadgeColor(member.role))}>
                        {member.role === 'admin' && <Shield className="h-3 w-3 mr-1.5" />}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                      {member.id === user?.id && (
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Last Active
                      </span>
                      <span className="font-medium">{getLastActiveText(member)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" /> Access Level
                      </span>
                      <span className="font-medium">Level {member.role === 'admin' ? '3' : '2'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Active</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((member) => (
                      <tr key={member.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className="bg-secondary text-xs">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className={cn("capitalize", getRoleBadgeColor(member.role))}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", getStatusColor(member))} />
                            <span className="text-muted-foreground text-xs">
                              {member.is_online ? 'Active' : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                          {getLastActiveText(member)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(member)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemove(member)}
                                disabled={member.id === user?.id}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter full name"
                className="bg-secondary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role & Permissions</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-primary" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removingMember?.full_name}</strong> from the workspace immediately. They will lose access to all cases and data. this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Team;
