import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Alert, AlertDescription } from '../../ui/alert';
import { toast } from 'sonner';
import { apiService } from '../../../utils/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  Building,
  Eye,
} from 'lucide-react';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  organization?: string;
  phone?: string;
  role: string;
  approval_status: string;
  created_at: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total_requests: number;
}

export const UserApprovalManagement: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  // Load pending users and stats
  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, statsResponse] = await Promise.all([
        apiService.getPendingUsers(),
        apiService.getApprovalStats()
      ]);

      if (pendingResponse.data) {
        setPendingUsers(pendingResponse.data);
      }

      if (statsResponse.data) {
        setApprovalStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading approval data:', error);
      toast.error('Failed to load user approval data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const handleApproveUser = async (userId: number, username: string) => {
    try {
      setProcessing(userId);
      const response = await apiService.approveUser(userId);
      
      if (response.data || response.message) {
        toast.success(`User ${username} approved successfully`);
        await loadData(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(`Failed to approve user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(selectedUser.id);
      const response = await apiService.rejectUser(selectedUser.id, rejectionReason.trim());
      
      if (response.data || response.message) {
        toast.success(`User ${selectedUser.username} rejected`);
        setIsRejectionDialogOpen(false);
        setRejectionReason('');
        setSelectedUser(null);
        await loadData(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error(`Failed to reject user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      researcher: 'bg-blue-100 text-blue-800',
      government_official: 'bg-purple-100 text-purple-800',
      community_member: 'bg-green-100 text-green-800',
    };

    const roleLabels: Record<string, string> = {
      researcher: 'Researcher',
      government_official: 'Government Official',
      community_member: 'Community Member',
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Only administrators can manage user approvals.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading user approval data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Approval Statistics */}
      {approvalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="size-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{approvalStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="size-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{approvalStats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="size-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{approvalStats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="size-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{approvalStats.total_requests}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Pending User Approvals
          </CardTitle>
          <CardDescription>
            Review and approve or reject new user registration requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="size-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending user approvals</p>
              <p className="text-sm text-muted-foreground">All users have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Details</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((pendingUser) => (
                    <TableRow key={pendingUser.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{pendingUser.full_name || pendingUser.username}</p>
                          <p className="text-sm text-muted-foreground">@{pendingUser.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="size-3" />
                            {pendingUser.email}
                          </div>
                          {pendingUser.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="size-3" />
                              {pendingUser.phone}
                            </div>
                          )}
                          {pendingUser.organization && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building className="size-3" />
                              {pendingUser.organization}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(pendingUser.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="size-3" />
                          {formatDate(pendingUser.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveUser(pendingUser.id, pendingUser.username)}
                            disabled={processing === pendingUser.id}
                          >
                            {processing === pendingUser.id ? (
                              <Clock className="size-4 animate-spin" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                            Approve
                          </Button>
                          
                          <Dialog 
                            open={isRejectionDialogOpen && selectedUser?.id === pendingUser.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setIsRejectionDialogOpen(false);
                                setSelectedUser(null);
                                setRejectionReason('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(pendingUser);
                                  setIsRejectionDialogOpen(true);
                                }}
                                disabled={processing === pendingUser.id}
                              >
                                <UserX className="size-4" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject User Registration</DialogTitle>
                                <DialogDescription>
                                  You are about to reject the registration request from{' '}
                                  <strong>{pendingUser.full_name || pendingUser.username}</strong>.
                                  Please provide a reason for the rejection.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Reason for Rejection</label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a clear reason for rejecting this user..."
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsRejectionDialogOpen(false);
                                      setSelectedUser(null);
                                      setRejectionReason('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleRejectUser}
                                    disabled={!rejectionReason.trim() || processing === pendingUser.id}
                                  >
                                    {processing === pendingUser.id ? (
                                      <Clock className="size-4 animate-spin mr-2" />
                                    ) : (
                                      <UserX className="size-4 mr-2" />
                                    )}
                                    Reject User
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};