import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { MapPin } from 'lucide-react';
import { Wetland } from './WetlandManagement';

interface WetlandFormProps {
  wetland?: Wetland;
  onSubmit: (wetlandData: Partial<Wetland>) => void;
  onCancel?: () => void;
}

export const WetlandForm: React.FC<WetlandFormProps> = ({ 
  wetland, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: wetland?.name || '',
    location: wetland?.location || '',
    size: wetland?.size || '',
    type: wetland?.type || '',
    description: wetland?.description || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Wetland name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.size || isNaN(Number(formData.size)) || Number(formData.size) <= 0) {
      newErrors.size = 'Valid size in hectares is required';
    }

    if (!formData.type) {
      newErrors.type = 'Wetland type is required';
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
      const wetlandData: Partial<Wetland> = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        size: Number(formData.size),
        type: formData.type,
        description: formData.description.trim() || null,
      };

      await onSubmit(wetlandData);
    } catch (error) {
      console.error('Error submitting wetland:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Wetland Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter wetland name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <Alert variant="destructive">
                <AlertDescription>{errors.name}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select wetland type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="constructed">Constructed</SelectItem>
                <SelectItem value="restored">Restored</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <Alert variant="destructive">
                <AlertDescription>{errors.type}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Size (hectares) *</Label>
          <Input
            id="size"
            type="number"
            step="0.1"
            min="0"
            value={formData.size}
            onChange={(e) => handleInputChange('size', e.target.value)}
            placeholder="0.0"
            className={errors.size ? 'border-destructive' : ''}
          />
          {errors.size && (
            <Alert variant="destructive">
              <AlertDescription>{errors.size}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the wetland characteristics, purpose, and significance..."
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
          <MapPin className="size-5 mr-2" />
          Location Information
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter location description (e.g., Gasabo District, Kigali)"
            className={errors.location ? 'border-destructive' : ''}
          />
          {errors.location && (
            <Alert variant="destructive">
              <AlertDescription>{errors.location}</AlertDescription>
            </Alert>
          )}
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
          {isSubmitting ? 'Saving...' : wetland ? 'Update Wetland' : 'Create Wetland'}
        </Button>
      </div>
    </form>
  );
};