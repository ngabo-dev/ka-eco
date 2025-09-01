import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, Search, Filter } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

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

interface SensorDataTableProps {
  sensorData: SensorReading[];
  wetlands: Wetland[];
}

export const SensorDataTable: React.FC<SensorDataTableProps> = ({ sensorData, wetlands }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof SensorReading>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Filter and sort data
  const filteredData = sensorData
    .filter(reading => {
      const wetlandName = getWetlandName(reading.wetland_id);
      return wetlandName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });

  const handleSort = (field: keyof SensorReading) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Wetland Name',
      'Temperature (°C)',
      'pH Level',
      'Dissolved Oxygen (mg/L)',
      'Turbidity (NTU)',
      'Status',
      'Timestamp'
    ];

    const csvData = filteredData.map(reading => [
      getWetlandName(reading.wetland_id),
      reading.temperature ?? 'N/A',
      reading.ph ?? 'N/A',
      reading.dissolved_oxygen ?? 'N/A',
      reading.turbidity ?? 'N/A',
      getStatus(reading),
      reading.timestamp
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wetland_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sensor Data</CardTitle>
            <CardDescription>
              Raw environmental data from all monitoring stations
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search wetlands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Wetland Name
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('temperature')}
                >
                  Temperature
                  {sortField === 'temperature' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('ph')}
                >
                  pH Level
                  {sortField === 'ph' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('dissolved_oxygen')}
                >
                  Dissolved O₂
                  {sortField === 'dissolved_oxygen' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('turbidity')}
                >
                  Turbidity
                  {sortField === 'turbidity' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('timestamp')}
                >
                  Last Updated
                  {sortField === 'timestamp' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((reading) => {
                const status = getStatus(reading);
                return (
                  <TableRow key={reading.id}>
                    <TableCell className="font-medium">
                      {getWetlandName(reading.wetland_id)}
                    </TableCell>
                    <TableCell>
                      {reading.temperature !== null ? `${reading.temperature}°C` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {reading.ph !== null ? reading.ph.toFixed(1) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {reading.dissolved_oxygen !== null ? `${reading.dissolved_oxygen} mg/L` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {reading.turbidity !== null ? `${reading.turbidity} NTU` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(status) as any}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(reading.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No sensor data found matching your filters.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing {filteredData.length} of {sensorData.length} readings</span>
          <span>
            Last updated: {sensorData.length > 0 ? new Date().toLocaleTimeString() : 'No data'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};