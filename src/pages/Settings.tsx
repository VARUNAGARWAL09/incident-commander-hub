import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Bell, Shield, Palette, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundAlerts: boolean;
  compactView: boolean;
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem('userSettings');
    return stored ? JSON.parse(stored) : {
      emailNotifications: true,
      pushNotifications: false,
      soundAlerts: true,
      compactView: false,
    };
  });
  
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [sessionTimeoutOpen, setSessionTimeoutOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof UserSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleUpdateName = async () => {
    if (!profile?.id || !newName.trim()) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName.trim() })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to update name');
    } else {
      toast.success('Name updated successfully');
      setEditNameOpen(false);
      setNewName('');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      toast.error('Failed to update email: ' + error.message);
    } else {
      toast.success('Verification email sent to new address');
      setEditEmailOpen(false);
      setNewEmail('');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Display Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile?.full_name || 'Not set'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setNewName(profile?.full_name || '');
                  setEditNameOpen(true);
                }}>Edit</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile?.email || 'Not set'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setNewEmail(profile?.email || '');
                  setEditEmailOpen(true);
                }}>Change</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {profile?.member_since 
                      ? format(new Date(profile.member_since), 'MMMM d, yyyy')
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email alerts for incidents</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch 
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">Play sound for critical alerts</p>
                </div>
                <Switch 
                  checked={settings.soundAlerts}
                  onCheckedChange={(checked) => updateSetting('soundAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch 
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing in tables</p>
                </div>
                <Switch 
                  checked={settings.compactView}
                  onCheckedChange={(checked) => updateSetting('compactView', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTwoFactorOpen(true)}>Enable</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSessionTimeoutOpen(true)}>Configure</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Display Name</DialogTitle>
            <DialogDescription>Enter your new display name</DialogDescription>
          </DialogHeader>
          <Input 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter your name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog open={editEmailOpen} onOpenChange={setEditEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>A verification link will be sent to your new email</DialogDescription>
          </DialogHeader>
          <Input 
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateEmail}>Send Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Two-factor authentication adds an extra layer of security to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p>2FA setup will be available in a future update.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTwoFactorOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Timeout Dialog */}
      <Dialog open={sessionTimeoutOpen} onOpenChange={setSessionTimeoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Timeout</DialogTitle>
            <DialogDescription>Configure automatic logout after inactivity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
              onClick={() => {
                localStorage.setItem('sessionTimeout', '15');
                toast.success('Session timeout set to 15 minutes');
                setSessionTimeoutOpen(false);
              }}>
              <span>15 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
              onClick={() => {
                localStorage.setItem('sessionTimeout', '30');
                toast.success('Session timeout set to 30 minutes');
                setSessionTimeoutOpen(false);
              }}>
              <span>30 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
              onClick={() => {
                localStorage.setItem('sessionTimeout', '60');
                toast.success('Session timeout set to 1 hour');
                setSessionTimeoutOpen(false);
              }}>
              <span>1 hour</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
              onClick={() => {
                localStorage.setItem('sessionTimeout', 'never');
                toast.success('Session timeout disabled');
                setSessionTimeoutOpen(false);
              }}>
              <span>Never</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionTimeoutOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
