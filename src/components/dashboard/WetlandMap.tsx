import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Thermometer, Droplets, Eye, TrendingUp } from 'lucide-react';

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

interface WetlandMapProps {
  wetlands: Wetland[];
  sensorData: SensorReading[];
}

// Mock coordinates for Kigali wetlands
const wetlandCoordinates: { [key: number]: { lat: number; lng: number; name: string } } = {
  1: { lat: -1.9441, lng: 30.0619, name: 'Nyandungu Urban Wetland' },
  2: { lat: -1.9706, lng: 30.1044, name: 'Kimisagara Wetland' },
  3: { lat: -1.9536, lng: 30.0946, name: 'Rugenge Marsh' },
  4: { lat: -1.9365, lng: 30.1288, name: 'Kacyiru Wetland Park' },
};

export const WetlandMap: React.FC<WetlandMapProps> = ({ wetlands, sensorData }) => {
  const [selectedWetland, setSelectedWetland] = useState<Wetland | null>(null);

  // Get latest sensor reading for a wetland
  const getLatestSensorData = (wetlandId: number): SensorReading | null => {
    const wetlandSensorData = sensorData.filter(s => s.wetland_id === wetlandId);
    if (wetlandSensorData.length === 0) return null;
    
    return wetlandSensorData.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  // Determine status based on sensor values
  const getStatus = (sensorReading: SensorReading | null): 'normal' | 'warning' | 'critical' => {
    if (!sensorReading) return 'normal';
    
    const { temperature, ph, dissolved_oxygen, turbidity } = sensorReading;
    
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Wetland Locations</CardTitle>
          <CardDescription>Interactive map of monitored wetlands in Kigali</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simulated Map View */}
          <div className="relative bg-slate-100 rounded-lg h-96 overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
              <svg className="w-full h-full opacity-20" viewBox="0 0 400 300">
                {/* Rivers */}
                <path d="M50 100 Q150 120 200 90 T350 110" stroke="#3b82f6" strokeWidth="3" fill="none" />
                <path d="M100 200 Q180 180 220 190 T300 180" stroke="#3b82f6" strokeWidth="2" fill="none" />
                
                {/* Urban areas */}
                <rect x="120" y="130" width="40" height="30" fill="#e5e7eb" opacity="0.7" />
                <rect x="180" y="110" width="35" height="25" fill="#e5e7eb" opacity="0.7" />
                <rect x="200" y="160" width="45" height="35" fill="#e5e7eb" opacity="0.7" />
                
                {/* Green spaces */}
                <circle cx="80" cy="150" r="25" fill="#10b981" opacity="0.3" />
                <circle cx="280" cy="120" r="30" fill="#10b981" opacity="0.3" />
                <circle cx="320" cy="200" r="20" fill="#10b981" opacity="0.3" />
              </svg>
            </div>

            {/* Wetland Markers */}
            {wetlands.map((wetland) => {
              const coords = wetlandCoordinates[wetland.id];
              if (!coords) return null;

              const latestSensorData = getLatestSensorData(wetland.id);
              const status = getStatus(latestSensorData);

              // Convert lat/lng to relative positions (simplified)
              const x = ((coords.lng + 2) * 200) % 350 + 25;
              const y = ((coords.lat + 2) * 150) % 250 + 25;
              return (
                <div
                  key={wetland.id}
                  className="wetland-marker absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  data-x={x}
                  data-y={y}
                  onClick={() => setSelectedWetland(wetland)}
                >
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(status)} border-2 border-white shadow-lg pulse-animation`}>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                    <div className="bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap">
                      {wetland.name.split(' ')[0]}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button size="sm" variant="outline" className="bg-white">
                <MapPin className="size-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
              <h4 className="font-medium mb-2">Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Normal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Warning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wetland Details */}
      <Card>
        <CardHeader>
          <CardTitle>Wetland Details</CardTitle>
          <CardDescription>
            {selectedWetland ? 'Current sensor readings' : 'Select a wetland on the map'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedWetland ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">{selectedWetland.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedWetland.location}</p>
                <p className="text-xs text-muted-foreground">{selectedWetland.size} hectares • {selectedWetland.type}</p>
                <Badge variant={getStatusBadgeVariant(getStatus(getLatestSensorData(selectedWetland.id))) as any}>
                  {getStatus(getLatestSensorData(selectedWetland.id)).toUpperCase()}
                </Badge>
              </div>

              {(() => {
                const latestSensorData = getLatestSensorData(selectedWetland.id);
                if (!latestSensorData) {
                  return (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No sensor data available</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="size-4 text-muted-foreground" />
                        <span className="text-sm">Temperature</span>
                      </div>
                      <span className="font-medium">
                        {latestSensorData.temperature !== null ? `${latestSensorData.temperature}°C` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Droplets className="size-4 text-muted-foreground" />
                        <span className="text-sm">pH Level</span>
                      </div>
                      <span className="font-medium">
                        {latestSensorData.ph !== null ? latestSensorData.ph.toFixed(1) : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="size-4 text-muted-foreground" />
                        <span className="text-sm">Dissolved O₂</span>
                      </div>
                      <span className="font-medium">
                        {latestSensorData.dissolved_oxygen !== null ? `${latestSensorData.dissolved_oxygen} mg/L` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Eye className="size-4 text-muted-foreground" />
                        <span className="text-sm">Turbidity</span>
                      </div>
                      <span className="font-medium">
                        {latestSensorData.turbidity !== null ? `${latestSensorData.turbidity} NTU` : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(latestSensorData.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Click on a wetland marker to view detailed sensor readings and environmental data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};