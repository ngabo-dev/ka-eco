import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { EnvironmentalCharts } from './EnvironmentalCharts';
import { WetlandMap } from './WetlandMap';
import { SensorDataTable } from './SensorDataTable';
import { AlertsPanel } from './AlertsPanel';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../../utils/api';
import { toast } from 'sonner';
import { AdaptiveDashboard } from './AdaptiveDashboard';
import { UserManagement } from './admin/UserManagement';
import { UserApprovalManagement } from './admin/UserApprovalManagement';
import {
  hasPermission,
  canAccessSection,
  getAllowedSections,
  getUserCapabilities,
  UserRole,
} from '../../utils/permissions';
import {
  Droplets,
  Thermometer,
  Wind,
  Eye,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Activity,
  RefreshCw,
  CloudRain,
  TreePine,
  Factory,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Shield,
  Target,
  BarChart3,
  UserCheck,
} from 'lucide-react';

interface SensorReading {
  id: number;
  wetland_id: number;
  timestamp: string;
  temperature: number | null;
  ph: number | null;
  dissolved_oxygen: number | null;
  turbidity: number | null;
}

interface Wetland {
  id: number;
  name: string;
  location: string;
  size: number;
  type: string;
  description?: string;
  created_at: string;
}

interface Observation {
  id: number;
  wetland_id: number;
  species: string;
  count: number;
  date: string;
  notes?: string;
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  icon: any;
  color: 'destructive' | 'default' | 'secondary';
}

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: any;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const userRole = user?.role as UserRole;
  const allowedSections = getAllowedSections(userRole);
  const capabilities = getUserCapabilities(userRole);

  useEffect(() => {
    // Initialize dashboard based on user role
    setLoading(false);
  }, [user]);

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

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please log in to access the dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  // Define tabs based on user role and permissions
  const getDashboardTabs = () => {
    const tabs = [
      {
        id: 'overview',
        label: 'Overview',
        icon: BarChart3,
        component: <AdaptiveDashboard />,
        available: true,
      },
    ];

    // Admin-specific tabs
    if (capabilities.canManageUsers) {
      tabs.push({
        id: 'user_management',
        label: 'User Management',
        icon: Users,
        component: <UserManagement />,
        available: canAccessSection(userRole, 'user_management'),
      });

      tabs.push({
        id: 'user_approval',
        label: 'User Approvals',
        icon: UserCheck,
        component: <UserApprovalManagement />,
        available: canAccessSection(userRole, 'user_management'),
      });
    }

    // Environmental monitoring tabs (available to most roles)
    if (hasPermission(userRole, 'read', 'sensors')) {
      tabs.push({
        id: 'sensors',
        label: 'Sensor Data',
        icon: Zap,
        component: <SensorDataTable sensorData={[]} wetlands={[]} />,
        available: true,
      });
    }

    if (hasPermission(userRole, 'read', 'wetlands')) {
      tabs.push({
        id: 'wetlands',
        label: 'Wetland Map',
        icon: MapPin,
        component: <WetlandMap wetlands={[]} sensorData={[]} />,
        available: true,
      });
    }

    if (hasPermission(userRole, 'read', 'analytics')) {
      tabs.push({
        id: 'analytics',
        label: 'Analytics',
        icon: TrendingUp,
        component: <EnvironmentalCharts sensorData={[]} />,
        available: true,
      });
    }

    if (hasPermission(userRole, 'read', 'alerts')) {
      tabs.push({
        id: 'alerts',
        label: 'Alerts',
        icon: Bell,
        component: <AlertsPanel />,
        available: true,
      });
    }

    return tabs.filter(tab => tab.available);
  };

  const availableTabs = getDashboardTabs();

  return (
    <div className="space-y-6">
      {/* Role-based Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
          {availableTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="size-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>

      {/* Role Information Footer */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="size-4" />
              <span>
                Logged in as {user.role === 'admin' ? 'Administrator' : 
                           user.role === 'researcher' ? 'Researcher' :
                           user.role === 'government_official' ? 'Government Official' :
                           'Community Member'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Available sections: {allowedSections.length}</span>
              <Badge variant="outline" className="text-xs">
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};