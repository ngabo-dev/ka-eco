import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Wetland, Observation } from './WetlandManagement';

interface ObservationFormProps {
  wetlands: Wetland[];
  observation?: Observation;
  onSubmit: (observationData: any) => void;
  onCancel?: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ 
  wetlands,
  observation, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    wetland_id: observation?.wetland_id || '',
    species: observation?.species || '',
    count: observation?.count || '',
    date: observation?.date ? new Date(observation.date) : new Date(),
    notes: observation?.notes || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.wetland_id) {
      newErrors.wetland_id = 'Please select a wetland';
    }

    if (!formData.species.trim()) {
      newErrors.species = 'Species name is required';
    }

    if (!formData.count || isNaN(Number(formData.count)) || Number(formData.count) < 0) {
      newErrors.count = 'Valid count is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const observationData = {
        wetland_id: Number(formData.wetland_id),
        species: formData.species.trim(),
        count: Number(formData.count),
        date: formData.date.toISOString(),
        notes: formData.notes.trim() || null,
      };

      await onSubmit(observationData);
    } catch (error) {
      console.error('Error submitting observation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Observation Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="wetland_id">Wetland Site *</Label>
          <Select 
            value={formData.wetland_id.toString()} 
            onValueChange={(value) => handleInputChange('wetland_id', value)}
          >
            <SelectTrigger className={errors.wetland_id ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select a wetland" />
            </SelectTrigger>
            <SelectContent>
              {wetlands.map((wetland) => (
                <SelectItem key={wetland.id} value={wetland.id.toString()}>
                  {wetland.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wetland_id && (
            <Alert variant="destructive">
              <AlertDescription>{errors.wetland_id}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="species">Species *</Label>
          <Input
            id="species"
            value={formData.species}
            onChange={(e) => handleInputChange('species', e.target.value)}
            placeholder="Enter species name (e.g., Great Blue Heron, Water Hyacinth)"
            className={errors.species ? 'border-destructive' : ''}
          />
          {errors.species && (
            <Alert variant="destructive">
              <AlertDescription>{errors.species}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="count">Count *</Label>
          <Input
            id="count"
            type="number"
            min="0"
            value={formData.count}
            onChange={(e) => handleInputChange('count', e.target.value)}
            placeholder="Number of individuals observed"
            className={errors.count ? 'border-destructive' : ''}
          />
          {errors.count && (
            <Alert variant="destructive">
              <AlertDescription>{errors.count}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Observation Date</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? (
                  formData.date.toLocaleDateString()
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange('date', date);
                    setDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional observations, behavior notes, environmental conditions, etc."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : observation ? 'Update Observation' : 'Submit Observation'}
        </Button>
      </div>
    </form>
  );
};