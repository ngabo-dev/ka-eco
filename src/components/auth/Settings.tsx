import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  User,
  Bell,
  Shield,
  Palette,
  Download,
  Globe,
  Database,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Droplets
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsData {
  // Account Settings
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;

  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  sensorAlerts: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;

  // Privacy Settings
  profileVisibility: 'public' | 'private' | 'researchers';
  dataSharing: boolean;
  analyticsTracking: boolean;

  // Appearance Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;

  // Data & Export Settings
  autoBackup: boolean;
  dataRetention: number;
  exportFormat: 'csv' | 'json' | 'xml';

  // Sensor Settings
  sensorUpdateFrequency: number;
  alertThresholds: {
    temperature: { min: number; max: number };
    ph: { min: number; max: number };
    turbidity: { min: number; max: number };
  };

  // API Settings
  apiAccess: boolean;
  apiKey: string;
}

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState<SettingsData>({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',

    emailNotifications: true,
    pushNotifications: true,
    sensorAlerts: true,
    weeklyReports: true,
    systemUpdates: false,

    profileVisibility: 'researchers',
    dataSharing: false,
    analyticsTracking: true,

    theme: 'system',
    language: 'en',
    timezone: 'UTC',

    autoBackup: true,
    dataRetention: 365,
    exportFormat: 'csv',

    sensorUpdateFrequency: 15,
    alertThresholds: {
      temperature: { min: 15, max: 35 },
      ph: { min: 6.5, max: 8.5 },
      turbidity: { min: 0, max: 50 }
    },

    apiAccess: false,
    apiKey: ''
  });

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<SettingsData>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (settings.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          current_password: settings.currentPassword,
          new_password: settings.newPassword,
          confirm_password: settings.confirmPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update password');
      }

      const data = await response.json();
      toast.success(data.message || 'Password updated successfully');

      // Clear the form
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    setLoading(true);
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Email updated successfully');
    } catch (error) {
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const newApiKey = 'ka_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSettings(prev => ({ ...prev, apiKey: newApiKey }));
    toast.success('New API key generated');
  };

  const exportData = async () => {
    setLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));

      const exportData = {
        user: user,
        settings: settings,
        exportDate: new Date().toISOString(),
        format: settings.exportFormat
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ka-eco-data-export-${new Date().toISOString().split('T')[0]}.${settings.exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <SettingsIcon className="size-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Customize your Ka-Eco experience and manage your account</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="size-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="size-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="size-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="size-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="size-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Key className="size-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Update your account details and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Update */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="size-4" />
                    Email Address
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="email">Current Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white dark:bg-slate-700"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleEmailUpdate} disabled={loading}>
                        {loading ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Update Email
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="size-4" />
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={settings.currentPassword}
                          onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="bg-white dark:bg-slate-700 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={settings.newPassword}
                          onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="bg-white dark:bg-slate-700 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={settings.confirmPassword}
                        onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-white dark:bg-slate-700"
                      />
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} disabled={loading}>
                    {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="size-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => saveSettings({ emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => saveSettings({ pushNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Sensor Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when sensor readings are outside normal ranges</p>
                    </div>
                    <Switch
                      checked={settings.sensorAlerts}
                      onCheckedChange={(checked) => saveSettings({ sensorAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly environmental monitoring reports</p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => saveSettings({ weeklyReports: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">System Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified about system updates and maintenance</p>
                    </div>
                    <Switch
                      checked={settings.systemUpdates}
                      onCheckedChange={(checked) => saveSettings({ systemUpdates: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Manage your privacy settings and data sharing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <Select
                      value={settings.profileVisibility}
                      onValueChange={(value: 'public' | 'private' | 'researchers') => saveSettings({ profileVisibility: value })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can view</SelectItem>
                        <SelectItem value="researchers">Researchers Only</SelectItem>
                        <SelectItem value="private">Private - Only you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">Allow anonymous data sharing for research purposes</p>
                    </div>
                    <Switch
                      checked={settings.dataSharing}
                      onCheckedChange={(checked) => saveSettings({ dataSharing: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Analytics Tracking</Label>
                      <p className="text-sm text-muted-foreground">Help improve Ka-Eco by sharing usage analytics</p>
                    </div>
                    <Switch
                      checked={settings.analyticsTracking}
                      onCheckedChange={(checked) => saveSettings({ analyticsTracking: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="size-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of your Ka-Eco experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: 'light' | 'dark' | 'system') => saveSettings({ theme: value })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => saveSettings({ language: value })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => saveSettings({ timezone: value })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-5" />
                  Data Management
                </CardTitle>
                <CardDescription>Manage your data, backups, and export preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground">Automatically backup your data weekly</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => saveSettings({ autoBackup: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Retention (Days)</Label>
                    <Select
                      value={settings.dataRetention.toString()}
                      onValueChange={(value) => saveSettings({ dataRetention: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                        <SelectItem value="1095">3 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select
                      value={settings.exportFormat}
                      onValueChange={(value: 'csv' | 'json' | 'xml') => saveSettings({ exportFormat: value })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={exportData} disabled={loading} className="w-full">
                    {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
                    Export My Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sensor Settings */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="size-5" />
                  Sensor Configuration
                </CardTitle>
                <CardDescription>Configure sensor monitoring and alert thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sensor Update Frequency (minutes)</Label>
                    <Select
                      value={settings.sensorUpdateFrequency.toString()}
                      onValueChange={(value) => saveSettings({ sensorUpdateFrequency: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Alert Thresholds</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Temperature (°C)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={settings.alertThresholds.temperature.min}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                temperature: { ...prev.alertThresholds.temperature, min: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                            className="bg-white dark:bg-slate-700"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={settings.alertThresholds.temperature.max}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                temperature: { ...prev.alertThresholds.temperature, max: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                            className="bg-white dark:bg-slate-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>pH Level</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Min"
                            value={settings.alertThresholds.ph.min}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                ph: { ...prev.alertThresholds.ph, min: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                            className="bg-white dark:bg-slate-700"
                          />
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Max"
                            value={settings.alertThresholds.ph.max}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                ph: { ...prev.alertThresholds.ph, max: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                            className="bg-white dark:bg-slate-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Turbidity (NTU)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={settings.alertThresholds.turbidity.min}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                turbidity: { ...prev.alertThresholds.turbidity, min: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                            className="bg-white dark:bg-slate-700"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={settings.alertThresholds.turbidity.max}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              alertThresholds: {
                                ...prev.alertThresholds,
                                turbidity: { ...prev.alertThresholds.turbidity, max: parseFloat(e.target.value) || 0 }
                              }
                            }))}
                            className="bg-white dark:bg-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="size-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Developer options and API configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">API Access</Label>
                      <p className="text-sm text-muted-foreground">Enable API access for third-party integrations</p>
                    </div>
                    <Switch
                      checked={settings.apiAccess}
                      onCheckedChange={(checked) => saveSettings({ apiAccess: checked })}
                    />
                  </div>

                  {settings.apiAccess && (
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          value={settings.apiKey}
                          readOnly
                          className="bg-gray-50 dark:bg-slate-700 font-mono text-sm"
                        />
                        <Button onClick={generateApiKey} variant="outline">
                          <RefreshCw className="size-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Keep this key secure. It provides full access to your account.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Danger Zone
                  </h4>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      These actions cannot be undone. Please proceed with caution.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="flex-1">
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Account</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Please explain why you're deleting your account (optional)"
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1">Cancel</Button>
                            <Button variant="destructive" className="flex-1">
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="flex-1">
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};