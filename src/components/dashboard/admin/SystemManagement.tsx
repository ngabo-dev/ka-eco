import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { useAuth } from '../../auth/AuthContext';
import { toast } from 'sonner';
import {
  Settings,
  Shield,
  Database,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  HardDrive,
  Wifi,
  Clock,
  BarChart3,
  FileText,
  Download,
  Upload,
} from 'lucide-react';

interface SystemStats {
  uptime: string;
  database_status: 'healthy' | 'warning' | 'error';
  active_users: number;
  total_requests_today: number;
  storage_usage: {
    used: number;
    total: number;
    percentage: number;
  };
  api_response_time: number;
  backup_status: {
    last_backup: string;
    status: 'success' | 'failed' | 'in_progress';
  };
}

export const SystemManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Simulate system stats - in a real app, this would come from an API
      setSystemStats({
        uptime: '15 days, 6 hours',
        database_status: 'healthy',
        active_users: 42,
        total_requests_today: 15847,
        storage_usage: {
          used: 4.2,
          total: 10,
          percentage: 42,
        },
        api_response_time: 125,
        backup_status: {
          last_backup: '2024-01-20T02:00:00Z',
          status: 'success',
        },
      });
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load system data');
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupInProgress(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('System backup completed successfully');
      loadSystemData(); // Refresh data
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing data export...');
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Data export ready for download');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access system management features.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading system information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Management</h2>
          <p className="text-muted-foreground">Monitor and manage system health and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="size-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={handleBackup}
            disabled={backupInProgress}
          >
            <Upload className="size-4 mr-2" />
            {backupInProgress ? 'Backing up...' : 'Backup Now'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Clock className="size-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.uptime}</div>
              <p className="text-xs text-muted-foreground">Continuous operation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="size-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {systemStats.database_status === 'healthy' ? (
                  <>
                    <CheckCircle className="size-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600">Healthy</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-5 text-yellow-600" />
                    <span className="text-xl font-bold text-yellow-600">Warning</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Connection stable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="size-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.active_users}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests</CardTitle>
              <Activity className="size-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.total_requests_today.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Requests today</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Performance */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="size-5" />
                Storage Usage
              </CardTitle>
              <CardDescription>Current storage utilization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Used Storage</span>
                  <span>{systemStats.storage_usage.used} GB / {systemStats.storage_usage.total} GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      systemStats.storage_usage.percentage > 80 ? 'bg-red-600' :
                      systemStats.storage_usage.percentage > 60 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${systemStats.storage_usage.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.storage_usage.percentage}% of total capacity
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="size-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>API and system performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <Badge variant={systemStats.api_response_time < 200 ? "secondary" : "destructive"}>
                  {systemStats.api_response_time}ms
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Queries</span>
                <Badge variant="secondary">Fast</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Hit Rate</span>
                <Badge variant="secondary">94%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup & Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Backup & Maintenance
          </CardTitle>
          <CardDescription>System backup and maintenance operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Last Backup</h4>
                  <Badge variant={systemStats?.backup_status.status === 'success' ? "secondary" : "destructive"}>
                    {systemStats?.backup_status.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {systemStats?.backup_status.last_backup && 
                    new Date(systemStats.backup_status.last_backup).toLocaleString()
                  }
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Scheduled Maintenance</h4>
                <p className="text-sm text-muted-foreground">
                  Next maintenance window: Sunday 2:00 AM UTC
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated duration: 30 minutes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">System Logs</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  View and download system logs for troubleshooting
                </p>
                <Button variant="outline" size="sm">
                  <FileText className="size-4 mr-2" />
                  View Logs
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Database Maintenance</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Optimize database performance and clean up old data
                </p>
                <Button variant="outline" size="sm">
                  <Database className="size-4 mr-2" />
                  Optimize DB
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Global system settings and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">User Registration</h4>
                  <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                </div>
                <Badge variant="secondary">Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">System alert notifications</p>
                </div>
                <Badge variant="secondary">Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">API Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">Request rate limits</p>
                </div>
                <Badge variant="secondary">1000/hour</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Data Retention</h4>
                  <p className="text-sm text-muted-foreground">Sensor data retention period</p>
                </div>
                <Badge variant="secondary">2 years</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">User session duration</p>
                </div>
                <Badge variant="secondary">30 minutes</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Backup Frequency</h4>
                  <p className="text-sm text-muted-foreground">Automated backup schedule</p>
                </div>
                <Badge variant="secondary">Daily</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};