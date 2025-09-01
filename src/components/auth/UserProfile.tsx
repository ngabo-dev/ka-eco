import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Droplets
} from 'lucide-react';
import { toast } from 'sonner';

export const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    organization: user?.organization || '',
    phone: user?.phone || ''
  });

  if (!user) return null;

  const handleSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditForm({
      full_name: user?.full_name || '',
      organization: user?.organization || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'researcher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'government_official':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'community_member':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'researcher':
        return '🔬';
      case 'government_official':
        return '🏛️';
      case 'community_member':
        return '🌱';
      default:
        return '👤';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Droplets className="size-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {user.full_name
                      ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : user.username.charAt(0).toUpperCase()
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">{user.full_name || user.username}</CardTitle>
                  <CardDescription className="flex items-center space-x-2 mt-1">
                    <span>{getRoleIcon(user.role)}</span>
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="size-4" />
                  <span>Edit Profile</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                <User className="size-5" />
                <span>Personal Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <User className="size-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{user.username}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <Mail className="size-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">{user.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      placeholder="Enter your full name"
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <User className="size-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{user.full_name || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <Phone className="size-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{user.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                <Building className="size-5" />
                <span>Professional Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.organization}
                      onChange={(e) => setEditForm({...editForm, organization: e.target.value})}
                      placeholder="Enter your organization"
                      className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <Building className="size-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{user.organization || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <Shield className="size-4 text-gray-500 dark:text-gray-400" />
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                <Calendar className="size-5" />
                <span>Account Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</Label>
                  <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    <span className="text-green-700 dark:text-green-400 font-medium">Active</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <Calendar className="size-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(user.created_at)}</span>
                  </div>
                </div>

                {user.last_login && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <Calendar className="size-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{formatDate(user.last_login)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};