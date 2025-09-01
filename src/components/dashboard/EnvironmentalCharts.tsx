import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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
}

interface EnvironmentalChartsProps {
  sensorData: SensorReading[];
  wetlands: Wetland[];
}

export const EnvironmentalCharts: React.FC<EnvironmentalChartsProps> = ({ sensorData, wetlands }) => {
  // Get wetland name by ID
  const getWetlandName = (wetlandId: number) => {
    const wetland = wetlands.find(w => w.id === wetlandId);
    return wetland?.name || `Wetland ${wetlandId}`;
  };

  // Determine status based on sensor values
  const getStatus = (reading: SensorReading): 'normal' | 'warning' | 'critical' => {
    const { temperature, ph, dissolved_oxygen, turbidity } = reading;
    
    // Check for critical conditions
    if (temperature !== null && (temperature < 5 || temperature > 35)) return 'critical';
    if (ph !== null && (ph < 6 || ph > 8.5)) return 'critical';
    if (dissolved_oxygen !== null && dissolved_oxygen < 5) return 'critical';
    if (turbidity !== null && turbidity > 10) return 'critical';
    
    // Check for warning conditions
    if (temperature !== null && (temperature < 10 || temperature > 30)) return 'warning';
    if (ph !== null && (ph < 6.5 || ph > 8)) return 'warning';
    if (dissolved_oxygen !== null && dissolved_oxygen < 7) return 'warning';
    if (turbidity !== null && turbidity > 5) return 'warning';
    
    return 'normal';
  };

  // Generate historical data for trend charts from actual sensor data
  const generateHistoricalData = () => {
    if (sensorData.length === 0) {
      // Fallback to mock data if no real data is available
      const hours = Array.from({ length: 24 }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (23 - i));
        return date;
      });

      return hours.map(hour => ({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temperature: 20 + Math.random() * 8 + Math.sin(hour.getHours() / 24 * Math.PI * 2) * 3,
        ph: 7 + Math.random() * 1.5 - 0.75,
        dissolved_oxygen: 6 + Math.random() * 3,
        turbidity: Math.random() * 40,
      }));
    }

    // Use actual sensor data, aggregated by hour
    const sortedData = sensorData
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24); // Get last 24 readings

    return sortedData.map(reading => ({
      time: new Date(reading.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temperature: reading.temperature || 0,
      ph: reading.ph || 7,
      dissolved_oxygen: reading.dissolved_oxygen || 0,
      turbidity: reading.turbidity || 0,
    }));
  };

  const historicalData = generateHistoricalData();

  // Status distribution for pie chart
  const statusData = [
    { name: 'Normal', value: sensorData.filter(d => getStatus(d) === 'normal').length, color: '#10b981' },
    { name: 'Warning', value: sensorData.filter(d => getStatus(d) === 'warning').length, color: '#f59e0b' },
    { name: 'Critical', value: sensorData.filter(d => getStatus(d) === 'critical').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // If no data, show equal distribution for demo
  if (statusData.length === 0) {
    statusData.push(
      { name: 'Normal', value: 3, color: '#10b981' },
      { name: 'Warning', value: 1, color: '#f59e0b' },
    );
  }

  // Wetland comparison data - get latest reading for each wetland
  const wetlandComparison = wetlands.map(wetland => {
    const latestReading = sensorData
      .filter(s => s.wetland_id === wetland.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      name: wetland.name.split(' ')[0], // Shortened name
      temperature: latestReading?.temperature || 0,
      ph: latestReading?.ph || 7,
      dissolved_oxygen: latestReading?.dissolved_oxygen || 0,
      turbidity: latestReading?.turbidity || 0,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Debug info - remove in production */}
      {sensorData.length === 0 && (
        <div className="col-span-full p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Analytics Debug:</strong> No sensor data available. Charts showing sample data.
            Sensor count: {sensorData.length}, Wetlands: {wetlands.length}
          </p>
        </div>
      )}
      {/* Temperature Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Trend (24h)</CardTitle>
          <CardDescription>Average temperature across all wetlands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* pH Levels */}
      <Card>
        <CardHeader>
          <CardTitle>pH Levels (24h)</CardTitle>
          <CardDescription>Water acidity/alkalinity monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[6, 9]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Wetland Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Wetland Comparison</CardTitle>
          <CardDescription>Current readings across all monitoring sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wetlandComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="temperature" fill="var(--color-chart-1)" name="Temperature (°C)" />
                <Bar dataKey="dissolved_oxygen" fill="var(--color-chart-3)" name="Dissolved Oxygen (mg/L)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>System Status Distribution</CardTitle>
          <CardDescription>Current status of all monitoring sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dissolved Oxygen Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Dissolved Oxygen (24h)</CardTitle>
          <CardDescription>Oxygen levels in water for aquatic life</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="dissolved_oxygen"
                  stroke="var(--color-chart-3)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Turbidity Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Turbidity Levels (24h)</CardTitle>
          <CardDescription>Water clarity and suspended particles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="turbidity"
                  stroke="var(--color-chart-4)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};