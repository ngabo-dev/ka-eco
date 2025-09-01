import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../../utils/api';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  BellOff,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface AlertData {
  id: number;
  title: string;
  message: string;
  alert_type: string;
  severity: string;
  is_active: boolean;
  wetland_id?: number;
  sensor_id?: number;
  threshold_value?: number;
  actual_value?: number;
  created_at: string;
  resolved_at?: string;
  acknowledged_by?: number;
  acknowledged_at?: string;
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const AlertsPanel: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlertsAndNotifications = async () => {
    try {
      const [alertsResponse, notificationsResponse] = await Promise.all([
        apiService.getAlerts(),
        apiService.getNotifications()
      ]);

      if (alertsResponse.data) {
        setAlerts(alertsResponse.data);
      }

      if (notificationsResponse.data) {
        setNotifications(notificationsResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load alerts and notifications');
      console.error('Alerts loading error:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAlertsAndNotifications();
    setRefreshing(false);
    toast.success('Alerts refreshed');
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadAlertsAndNotifications();
      setLoading(false);
    };

    initializeData();
  }, []);

  const acknowledgeAlert = async (alertId: number) => {
    try {
      await apiService.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      await loadAlertsAndNotifications();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      await apiService.resolveAlert(alertId);
      toast.success('Alert resolved');
      await loadAlertsAndNotifications();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationRead(notificationId);
      await loadAlertsAndNotifications();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return Bell;
      default: return Bell;
    }
  };

  const activeAlerts = alerts.filter(alert => alert.is_active);
  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
          <p className="text-muted-foreground">
            Monitor system alerts and manage notifications
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={refreshing}
        >
          <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertCircle className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeAlerts.filter(a => a.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.resolved_at &&
                new Date(a.resolved_at).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            Alerts ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No active alerts at this time.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const IconComponent = getSeverityIcon(alert.severity);
                return (
                  <Alert key={alert.id} variant={getSeverityColor(alert.severity) as any}>
                    <IconComponent className="h-4 w-4" />
                    <AlertDescription className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.alert_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                            {alert.wetland_id && (
                              <Badge variant="secondary" className="text-xs">
                                Wetland {alert.wetland_id}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!alert.acknowledged_by && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <Eye className="size-3 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <Check className="size-3 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <BellOff className="size-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">You don't have any notifications yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className={notification.is_read ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{notification.title}</h4>
                          {!notification.is_read && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.notification_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-3">
            {alerts.filter(alert => !alert.is_active).map((alert) => (
              <Card key={alert.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs text-green-600">
                          Resolved
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(alert.created_at).toLocaleString()}
                        </span>
                        {alert.resolved_at && (
                          <span className="text-xs text-muted-foreground">
                            Resolved: {new Date(alert.resolved_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <CheckCircle className="size-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {alerts.filter(alert => !alert.is_active).length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Clock className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">No resolved alerts in history.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};