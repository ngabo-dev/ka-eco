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
  Target
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
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [wetlands, setWetlands] = useState<Wetland[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [wetlandsResponse, sensorResponse, observationsResponse] = await Promise.all([
        apiService.getWetlands(),
        apiService.getSensorData(),
        apiService.getObservations()
      ]);

      if (wetlandsResponse.data) {
        setWetlands(wetlandsResponse.data);
      }
      
      if (sensorResponse.data) {
        setSensorData(sensorResponse.data);
      }
      
      if (observationsResponse.data) {
        setObservations(observationsResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard data loading error:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      await loadDashboardData();
      setLoading(false);
    };

    initializeDashboard();
  }, []);

  const getAverageTemperature = () => {
    const validTemps = sensorData.filter(d => d.temperature !== null);
    if (validTemps.length === 0) return 0;
    return validTemps.reduce((sum, d) => sum + d.temperature!, 0) / validTemps.length;
  };

  const getAveragePH = () => {
    const validPH = sensorData.filter(d => d.ph !== null);
    if (validPH.length === 0) return 0;
    return validPH.reduce((sum, d) => sum + d.ph!, 0) / validPH.length;
  };

  const getTotalObservations = () => {
    return observations.reduce((sum, obs) => sum + obs.count, 0);
  };

  const getWaterQualityIndex = () => {
    const validReadings = sensorData.filter(d => d.ph !== null && d.temperature !== null);
    if (validReadings.length === 0) return 0;

    let totalScore = 0;
    validReadings.forEach(reading => {
      let score = 100;

      // pH scoring (optimal: 6.5-8.5)
      if (reading.ph! < 6.5 || reading.ph! > 8.5) {
        score -= Math.abs(7.5 - reading.ph!) * 10;
      }

      // Temperature scoring (optimal: 15-30°C)
      if (reading.temperature! < 15 || reading.temperature! > 30) {
        score -= Math.abs(22.5 - reading.temperature!) * 2;
      }

      totalScore += Math.max(0, Math.min(100, score));
    });

    return Math.round(totalScore / validReadings.length);
  };

  const getBiodiversityCount = () => {
    const uniqueSpecies = new Set(observations.map(obs => obs.species));
    return uniqueSpecies.size;
  };

  const getPollutionLevel = () => {
    const validTurbidity = sensorData.filter(d => d.turbidity !== null);
    if (validTurbidity.length === 0) return { level: 'No Data', value: 0, color: 'text-gray-600' };

    const avgTurbidity = validTurbidity.reduce((sum, d) => sum + d.turbidity!, 0) / validTurbidity.length;

    // Pollution levels: Low (<10), Moderate (10-25), High (25-50), Critical (>50)
    if (avgTurbidity < 10) return { level: 'Low', value: avgTurbidity, color: 'text-green-600' };
    if (avgTurbidity < 25) return { level: 'Moderate', value: avgTurbidity, color: 'text-yellow-600' };
    if (avgTurbidity < 50) return { level: 'High', value: avgTurbidity, color: 'text-orange-600' };
    return { level: 'Critical', value: avgTurbidity, color: 'text-red-600' };
  };

  const getAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    // Water quality alerts
    const wqi = getWaterQualityIndex();
    if (wqi < 50) {
      alerts.push({
        type: 'critical',
        title: 'Poor Water Quality',
        message: `Water Quality Index: ${wqi}/100 - Immediate attention required`,
        icon: AlertTriangle,
        color: 'destructive'
      });
    } else if (wqi < 70) {
      alerts.push({
        type: 'warning',
        title: 'Water Quality Concerns',
        message: `Water Quality Index: ${wqi}/100 - Monitor closely`,
        icon: AlertTriangle,
        color: 'default'
      });
    }

    // Pollution alerts
    const pollution = getPollutionLevel();
    if (pollution.level === 'Critical') {
      alerts.push({
        type: 'critical',
        title: 'Critical Pollution Levels',
        message: `Turbidity: ${pollution.value.toFixed(1)} NTU - Emergency response needed`,
        icon: Factory,
        color: 'destructive'
      });
    }

    // Temperature alerts
    const avgTemp = getAverageTemperature();
    if (avgTemp > 35 || avgTemp < 10) {
      alerts.push({
        type: 'warning',
        title: 'Extreme Temperature',
        message: `Average temperature: ${avgTemp.toFixed(1)}°C - Check sensor calibration`,
        icon: Thermometer,
        color: 'default'
      });
    }

    // Biodiversity alerts
    const biodiversity = getBiodiversityCount();
    if (biodiversity < 3) {
      alerts.push({
        type: 'info',
        title: 'Low Biodiversity',
        message: `Only ${biodiversity} species observed - Consider conservation measures`,
        icon: TreePine,
        color: 'secondary'
      });
    }

    return alerts;
  };

  const getRecentActivity = (): Activity[] => {
    const activities: Activity[] = [];

    // Recent observations
    observations.slice(0, 3).forEach(obs => {
      activities.push({
        type: 'observation',
        title: `New ${obs.species} observation`,
        description: `${obs.count} individuals recorded`,
        timestamp: obs.date,
        icon: Eye
      });
    });

    // Recent sensor readings
    sensorData.slice(0, 2).forEach(sensor => {
      activities.push({
        type: 'sensor',
        title: 'Sensor data updated',
        description: `Wetland ${sensor.wetland_id} - Temp: ${sensor.temperature}°C`,
        timestamp: sensor.timestamp,
        icon: Activity
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Environmental Dashboard</h1>
          <p className="text-muted-foreground">
            Wetland monitoring system for {user?.username}
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Quality Index</CardTitle>
            <Droplets className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getWaterQualityIndex()}/100</div>
            <Progress value={getWaterQualityIndex()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Overall water health
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biodiversity Count</CardTitle>
            <TreePine className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getBiodiversityCount()}</div>
            <p className="text-xs text-muted-foreground">
              Unique species observed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pollution Level</CardTitle>
            <Factory className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPollutionLevel().color}`}>
              {getPollutionLevel().level}
            </div>
            <p className="text-xs text-muted-foreground">
              Turbidity: {getPollutionLevel().value.toFixed(1)} NTU
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wetlands</CardTitle>
            <MapPin className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wetlands.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently monitored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {getAlerts().length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="size-5" />
            Active Alerts
          </h2>
          <div className="grid gap-3">
            {getAlerts().map((alert, index) => {
              const IconComponent = alert.icon;
              return (
                <Alert key={index} variant={alert.color as any}>
                  <IconComponent className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{alert.title}:</strong> {alert.message}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            <Thermometer className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageTemperature().toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground">Optimal: 15-30°C</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Observations</CardTitle>
            <Eye className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalObservations()}</div>
            <p className="text-xs text-muted-foreground">Individual species count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sensor Health</CardTitle>
            <Zap className="size-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sensorData.length > 0 ? 'Online' : 'No Data'}
            </div>
            <p className="text-xs text-muted-foreground">
              {sensorData.length} active sensors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getRecentActivity().map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <IconComponent className="size-4 text-muted-foreground mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {getRecentActivity().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="size-8 mx-auto mb-2" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Wetlands</CardTitle>
                <CardDescription>Latest registered monitoring sites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wetlands.slice(0, 5).map((wetland) => (
                    <div key={wetland.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <h4 className="font-medium">{wetland.name}</h4>
                        <p className="text-sm text-muted-foreground">{wetland.location}</p>
                        <p className="text-xs text-muted-foreground">{wetland.size} hectares • {wetland.type}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                  {wetlands.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="size-8 mx-auto mb-2" />
                      <p>No wetlands registered yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Observations</CardTitle>
                <CardDescription>Latest species observations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {observations.slice(0, 5).map((observation) => (
                    <div key={observation.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <h4 className="font-medium">{observation.species}</h4>
                        <p className="text-sm text-muted-foreground">
                          Count: {observation.count} • Wetland ID: {observation.wetland_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(observation.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {observations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="size-8 mx-auto mb-2" />
                      <p>No observations recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <SensorDataTable sensorData={sensorData} wetlands={wetlands} />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <WetlandMap wetlands={wetlands} sensorData={sensorData} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Trends</CardTitle>
                <CardDescription>Water quality and temperature trends</CardDescription>
              </CardHeader>
              <CardContent>
                <EnvironmentalCharts sensorData={sensorData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Sensor status and data quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Sensors</span>
                  <Badge variant="default">{sensorData.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Quality</span>
                  <Badge variant={getWaterQualityIndex() > 70 ? "default" : "destructive"}>
                    {getWaterQualityIndex() > 70 ? "Good" : "Needs Attention"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Biodiversity Index</span>
                  <Badge variant="secondary">{getBiodiversityCount()} species</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Update</span>
                  <span className="text-xs text-muted-foreground">
                    {sensorData.length > 0 ? new Date(sensorData[0].timestamp).toLocaleString() : 'No data'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};