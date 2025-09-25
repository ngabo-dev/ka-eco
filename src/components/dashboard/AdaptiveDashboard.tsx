import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth, User } from '../auth/AuthContext';
import { apiService } from '../../utils/api';
import { toast } from 'sonner';
import {
  hasPermission,
  canAccessSection,
  getAllowedSections,
  getUserCapabilities,
  UserRole,
} from '../../utils/permissions';
import {
  Users,
  Shield,
  MapPin,
  Activity,
  Bell,
  Settings,
  BarChart3,
  FileText,
  Zap,
  TreePine,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  RefreshCw,
  Calendar,
  Building,
} from 'lucide-react';

interface DashboardStats {
  users?: {
    total: number;
    active: number;
    recent: number;
  };
  wetlands?: {
    total: number;
    monitored: number;
  };
  sensors?: {
    active: number;
    offline: number;
    total: number;
  };
  observations?: {
    total: number;
    recent: number;
    species: number;
  };
  alerts?: {
    critical: number;
    warning: number;
    total: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  user?: string;
}

export const AdaptiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const userRole = user?.role as UserRole;
  const allowedSections = getAllowedSections(userRole);
  const capabilities = getUserCapabilities(userRole);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const promises: Promise<any>[] = [];

      // Load data based on user permissions
      if (canAccessSection(userRole, 'user_management') && capabilities.canManageUsers) {
        promises.push(apiService.getUserStats());
      }

      if (hasPermission(userRole, 'read', 'wetlands')) {
        promises.push(apiService.getWetlands());
      }

      if (hasPermission(userRole, 'read', 'sensors')) {
        promises.push(apiService.getSensors());
      }

      if (hasPermission(userRole, 'read', 'observations')) {
        promises.push(apiService.getObservations());
      }

      const results = await Promise.allSettled(promises);
      
      let statsUpdate: DashboardStats = {};
      let activities: RecentActivity[] = [];

      // Process results based on what was requested
      let resultIndex = 0;

      if (capabilities.canManageUsers) {
        const userStatsResult = results[resultIndex++];
        if (userStatsResult.status === 'fulfilled' && userStatsResult.value.data) {
          const userStats = userStatsResult.value.data;
          statsUpdate.users = {
            total: userStats.total_users || 0,
            active: userStats.active_users || 0,
            recent: userStats.recent_registrations_30_days || 0,
          };
        }
      }

      if (hasPermission(userRole, 'read', 'wetlands')) {
        const wetlandsResult = results[resultIndex++];
        if (wetlandsResult.status === 'fulfilled' && wetlandsResult.value.data) {
          const wetlands = wetlandsResult.value.data;
          statsUpdate.wetlands = {
            total: wetlands.length,
            monitored: wetlands.filter((w: any) => w.sensors?.length > 0).length,
          };
        }
      }

      if (hasPermission(userRole, 'read', 'sensors')) {
        const sensorsResult = results[resultIndex++];
        if (sensorsResult.status === 'fulfilled' && sensorsResult.value.data) {
          const sensors = sensorsResult.value.data;
          const activeSensors = sensors.filter((s: any) => s.status === 'active');
          const offlineSensors = sensors.filter((s: any) => s.status !== 'active');
          
          statsUpdate.sensors = {
            active: activeSensors.length,
            offline: offlineSensors.length,
            total: sensors.length,
          };
        }
      }

      if (hasPermission(userRole, 'read', 'observations')) {
        const observationsResult = results[resultIndex++];
        if (observationsResult.status === 'fulfilled' && observationsResult.value.data) {
          const observations = observationsResult.value.data;
          const recentObs = observations.filter((o: any) => {
            const obsDate = new Date(o.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return obsDate > thirtyDaysAgo;
          });
          
          const uniqueSpecies = new Set(observations.map((o: any) => o.species));
          
          statsUpdate.observations = {
            total: observations.length,
            recent: recentObs.length,
            species: uniqueSpecies.size,
          };

          // Add recent observations to activity feed
          recentObs.slice(0, 3).forEach((obs: any) => {
            activities.push({
              id: `obs-${obs.id}`,
              type: 'observation',
              title: `New ${obs.species} observation`,
              description: `${obs.count} individuals recorded`,
              timestamp: obs.date,
              icon: Eye,
            });
          });
        }
      }

      setStats(statsUpdate);
      setRecentActivity(activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10));

    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      researcher: 'Researcher',
      government_official: 'Government Official',
      community_member: 'Community Member',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      government_official: 'bg-blue-100 text-blue-800',
      researcher: 'bg-green-100 text-green-800',
      community_member: 'bg-purple-100 text-purple-800',
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ka-Eco Dashboard</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">
              Welcome back, {user?.full_name || user?.username}
            </p>
            <Badge className={getRoleBadgeColor(user?.role || '')}>
              <Shield className="size-3 mr-1" />
              {getRoleDisplayName(user?.role || '')}
            </Badge>
          </div>
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

      {/* Role-based Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Management Stats (Admin only) */}
        {capabilities.canManageUsers && stats.users && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="size-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.users.active} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Registrations</CardTitle>
                <TrendingUp className="size-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.recent}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Wetland Stats */}
        {stats.wetlands && (
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wetlands</CardTitle>
              <MapPin className="size-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wetlands.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.wetlands.monitored} actively monitored
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sensor Stats */}
        {stats.sensors && (
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sensors</CardTitle>
              <Zap className="size-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sensors.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sensors.offline} offline • {stats.sensors.total} total
              </p>
            </CardContent>
          </Card>
        )}

        {/* Observation Stats */}
        {stats.observations && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Observations</CardTitle>
                <Eye className="size-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.observations.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.observations.recent} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Biodiversity</CardTitle>
                <TreePine className="size-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.observations.species}</div>
                <p className="text-xs text-muted-foreground">Unique species observed</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <IconComponent className="size-4 text-muted-foreground mt-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                        {activity.user && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{activity.user}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="size-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-based Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Admin Quick Actions */}
        {userRole === 'admin' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>Manage system users and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" size="sm">
                    <Users className="size-4 mr-2" />
                    View All Users
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Shield className="size-4 mr-2" />
                    Manage Roles
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Management</CardTitle>
                <CardDescription>System settings and monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" size="sm">
                    <Settings className="size-4 mr-2" />
                    System Settings
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <BarChart3 className="size-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Researcher Quick Actions */}
        {(userRole === 'researcher' || userRole === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Research Tools</CardTitle>
              <CardDescription>Data collection and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Eye className="size-4 mr-2" />
                  Add Observation
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <BarChart3 className="size-4 mr-2" />
                  Data Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Government Official Quick Actions */}
        {(userRole === 'government_official' || userRole === 'admin') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regulatory Tools</CardTitle>
              <CardDescription>Compliance and oversight</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <FileText className="size-4 mr-2" />
                  Compliance Reports
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <AlertTriangle className="size-4 mr-2" />
                  Review Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Member Quick Actions */}
        {userRole === 'community_member' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Actions</CardTitle>
              <CardDescription>Report issues and stay informed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Bell className="size-4 mr-2" />
                  Report Issue
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <MapPin className="size-4 mr-2" />
                  Local Wetlands
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Username</span>
                <span className="text-sm">{user?.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role</span>
                <Badge className={getRoleBadgeColor(user?.role || '')}>
                  {getRoleDisplayName(user?.role || '')}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              {user?.organization && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Organization</span>
                  <span className="text-sm flex items-center gap-1">
                    <Building className="size-3" />
                    {user.organization}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Status</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="size-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};