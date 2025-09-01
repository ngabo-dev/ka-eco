import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { WetlandForm } from './WetlandForm';
import { ObservationForm } from './ObservationForm';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../../utils/api';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar, 
  User, 
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

export interface Wetland {
  id: number;
  name: string;
  location: string;
  size: number; // area in hectares
  type: string;
  description?: string;
  created_at: string;
}

export interface Observation {
  id: number;
  wetland_id: number;
  species: string;
  count: number;
  date: string;
  notes?: string;
  wetland?: Wetland;
}

export const WetlandManagement: React.FC = () => {
  const { user } = useAuth();
  const [wetlands, setWetlands] = useState<Wetland[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWetland, setSelectedWetland] = useState<Wetland | null>(null);
  const [isWetlandDialogOpen, setIsWetlandDialogOpen] = useState(false);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data from API
  const loadWetlands = async () => {
    try {
      const response = await apiService.getWetlands();
      if (response.data) {
        setWetlands(response.data);
      } else if (response.error) {
        toast.error('Failed to load wetlands: ' + response.error);
      }
    } catch (error) {
      toast.error('Failed to load wetlands');
      console.error('Error loading wetlands:', error);
    }
  };

  const loadObservations = async () => {
    try {
      const response = await apiService.getObservations();
      if (response.data) {
        setObservations(response.data);
      } else if (response.error) {
        toast.error('Failed to load observations: ' + response.error);
      }
    } catch (error) {
      toast.error('Failed to load observations');
      console.error('Error loading observations:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadWetlands(), loadObservations()]);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadWetlands(), loadObservations()]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  useEffect(() => {
    loadData();
  }, []);

  const canManageWetlands = true; // All authenticated users can manage wetlands

  const filteredWetlands = wetlands.filter(wetland =>
    wetland.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wetland.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'natural': return 'default';
      case 'constructed': return 'secondary'; 
      case 'restored': return 'destructive';
      default: return 'outline';
    }
  };

  const handleCreateWetland = async (wetlandData: Partial<Wetland>) => {
    try {
      const response = await apiService.createWetland({
        name: wetlandData.name,
        location: wetlandData.location,
        size: wetlandData.size,
        type: wetlandData.type,
        description: wetlandData.description || null
      });
      
      if (response.data) {
        await loadWetlands(); // Refresh the wetlands list
        setIsWetlandDialogOpen(false);
        toast.success('Wetland created successfully');
      } else if (response.error) {
        toast.error('Failed to create wetland: ' + response.error);
      }
    } catch (error) {
      toast.error('Failed to create wetland');
      console.error('Error creating wetland:', error);
    }
  };

  const handleCreateObservation = async (observationData: any) => {
    try {
      const response = await apiService.createObservation({
        wetland_id: observationData.wetland_id,
        species: observationData.species,
        count: observationData.count,
        date: observationData.date,
        notes: observationData.notes || null
      });
      
      if (response.data) {
        await loadObservations(); // Refresh the observations list
        setIsObservationDialogOpen(false);
        toast.success('Observation recorded successfully');
      } else if (response.error) {
        toast.error('Failed to create observation: ' + response.error);
      }
    } catch (error) {
      toast.error('Failed to create observation');
      console.error('Error creating observation:', error);
    }
  };

  const handleDeleteWetland = async (id: number) => {
    if (confirm('Are you sure you want to delete this wetland? This action cannot be undone.')) {
      try {
        const response = await apiService.deleteWetland(id);
        if (response.data || !response.error) {
          await loadWetlands(); // Refresh the wetlands list
          toast.success('Wetland deleted successfully');
        } else if (response.error) {
          toast.error('Failed to delete wetland: ' + response.error);
        }
      } catch (error) {
        toast.error('Failed to delete wetland');
        console.error('Error deleting wetland:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading wetland data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Wetland Management</h1>
          <p className="text-muted-foreground">
            Manage wetland sites and field observations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canManageWetlands && (
            <>
              <Dialog open={isWetlandDialogOpen} onOpenChange={setIsWetlandDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Wetland
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Wetland</DialogTitle>
                    <DialogDescription>
                      Register a new wetland monitoring site
                    </DialogDescription>
                  </DialogHeader>
                  <WetlandForm onSubmit={handleCreateWetland} />
                </DialogContent>
              </Dialog>

              <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="size-4 mr-2" />
                    Add Observation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>New Field Observation</DialogTitle>
                    <DialogDescription>
                      Record environmental observations or issues
                    </DialogDescription>
                  </DialogHeader>
                  <ObservationForm wetlands={wetlands} onSubmit={handleCreateObservation} />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="wetlands" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wetlands">Wetland Sites</TabsTrigger>
          <TabsTrigger value="observations">Field Observations</TabsTrigger>
        </TabsList>

        <TabsContent value="wetlands" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search wetlands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Wetlands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWetlands.map((wetland) => (
              <Card key={wetland.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{wetland.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getTypeColor(wetland.type) as any}>
                          {wetland.type}
                        </Badge>
                      </div>
                    </div>
                    {canManageWetlands && (
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="size-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteWetland(wetland.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    <span>{wetland.location}</span>
                  </div>
                  
                  <p className="text-sm line-clamp-2">{wetland.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Area:</span>
                      <p className="font-medium">{wetland.size} hectares</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium capitalize">{wetland.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>
                      Created: {new Date(wetland.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWetlands.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No wetlands found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first wetland site.'}
              </p>
              {canManageWetlands && !searchTerm && (
                <Button onClick={() => setIsWetlandDialogOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  Add First Wetland
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="observations" className="space-y-4">
          <div className="space-y-4">
            {observations
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((observation) => (
                <Card key={observation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-base">{observation.species}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Wetland ID: {observation.wetland_id}</span>
                          <span>•</span>
                          <span>Count: {observation.count}</span>
                          <span>•</span>
                          <span>{new Date(observation.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{observation.notes}</p>
                  </CardContent>
                </Card>
              ))}

            {observations.length === 0 && (
              <div className="text-center py-12">
                <User className="size-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No observations recorded</h3>
                <p className="text-muted-foreground mb-4">
                  Start documenting environmental observations and field notes.
                </p>
                <Button onClick={() => setIsObservationDialogOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  Add First Observation
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};