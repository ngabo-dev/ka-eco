import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../../utils/api';
import { toast } from 'sonner';
import {
  MapPin,
  Camera,
  Upload,
  Send,
  AlertTriangle,
  CheckCircle,
  Users,
  Droplets,
  Trash2,
  X
} from 'lucide-react';

interface CommunityReport {
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string;
  report_type: string;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location_description: string;
  wetland_id?: number;
  severity: string;
}

export const CommunityReporting: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CommunityReport>({
    reporter_name: user?.full_name || '',
    reporter_email: user?.email || '',
    reporter_phone: '',
    report_type: '',
    title: '',
    description: '',
    location_description: '',
    severity: 'medium'
  });

  const reportTypes = [
    { value: 'pollution', label: 'Water Pollution', icon: Droplets, color: 'text-blue-600' },
    { value: 'encroachment', label: 'Land Encroachment', icon: MapPin, color: 'text-red-600' },
    { value: 'illegal_dumping', label: 'Illegal Dumping', icon: Trash2, color: 'text-orange-600' },
    { value: 'habitat_destruction', label: 'Habitat Destruction', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'other', label: 'Other Environmental Issue', icon: AlertTriangle, color: 'text-gray-600' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Impact', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Moderate Impact', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Impact', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical/Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const handleInputChange = (field: keyof CommunityReport, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const files = Array.from(fileList) as File[];
    const validImages = files.filter((file: File) => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
      }

      return isValidType && isValidSize;
    });

    setImages(prev => [...prev, ...validImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        toast.success('Location captured successfully');
      },
      (error) => {
        toast.error('Unable to get your location. Please enter it manually.');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.reporter_name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!formData.reporter_email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!formData.report_type) {
      toast.error('Please select a report type');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for your report');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description of the issue');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // Use fetch directly for multipart form data
      const response = await fetch('http://localhost:8000/community/', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit report');
      }

      const result = await response.json();
      toast.success('Report submitted successfully! We will review it and take appropriate action.');
      setSubmitted(true);

      // Reset form
      setFormData({
        reporter_name: user?.full_name || '',
        reporter_email: user?.email || '',
        reporter_phone: '',
        report_type: '',
        title: '',
        description: '',
        location_description: '',
        severity: 'medium'
      });
      setImages([]);
      setCurrentLocation(null);

    } catch (error) {
      console.error('Report submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="py-12">
              <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Report Submitted Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for helping protect our wetlands. Your report has been submitted and will be reviewed by our environmental team.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• You will receive an email confirmation shortly</p>
                <p>• Our team will investigate the reported issue</p>
                <p>• You may be contacted for additional information</p>
              </div>
              <Button
                onClick={() => setSubmitted(false)}
                className="mt-6"
              >
                Submit Another Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Users className="size-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Community Environmental Reporting</h1>
          <p className="text-gray-600 mt-2">
            Help protect our wetlands by reporting environmental issues and concerns
          </p>
        </div>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Report an Environmental Issue</CardTitle>
            <CardDescription>
              Your reports help us identify and address environmental concerns in our wetlands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporter_name">Full Name *</Label>
                    <Input
                      id="reporter_name"
                      value={formData.reporter_name}
                      onChange={(e) => handleInputChange('reporter_name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporter_email">Email Address *</Label>
                    <Input
                      id="reporter_email"
                      type="email"
                      value={formData.reporter_email}
                      onChange={(e) => handleInputChange('reporter_email', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporter_phone">Phone Number (Optional)</Label>
                  <Input
                    id="reporter_phone"
                    type="tel"
                    value={formData.reporter_phone}
                    onChange={(e) => handleInputChange('reporter_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Report Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="report_type">Type of Issue *</Label>
                  <Select value={formData.report_type} onValueChange={(value) => handleInputChange('report_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the type of environmental issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className={`size-4 ${type.color}`} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity Level *</Label>
                  <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How severe is this issue?" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <Badge variant="outline" className={level.color}>
                            {level.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief title describing the issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please provide as much detail as possible about the environmental issue you've observed..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="location_description">Location Description</Label>
                  <Textarea
                    id="location_description"
                    value={formData.location_description}
                    onChange={(e) => handleInputChange('location_description', e.target.value)}
                    placeholder="Describe the location (e.g., near the river bend, behind the shopping center, etc.)"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="size-4" />
                    Use Current Location
                  </Button>
                  {currentLocation && (
                    <Badge variant="secondary">
                      Location captured: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Supporting Images (Optional)</h3>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Camera className="size-4" />
                    Add Photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Upload images for environmental report"
                    title="Select images to upload"
                  />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Upload up to 5 images (max 5MB each). Supported formats: JPG, PNG, GIF
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Send className="size-4" />
                  {loading ? 'Submitting Report...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Section */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> All reports are confidential and will be investigated by our environmental team.
            You may be contacted for additional information. False reports may result in account suspension.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};