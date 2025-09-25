// Role-based access control utilities

export type UserRole = 'admin' | 'researcher' | 'government_official' | 'community_member';

export interface Permission {
  action: string;
  resource: string;
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // User management
    { action: 'create', resource: 'users' },
    { action: 'read', resource: 'users' },
    { action: 'update', resource: 'users' },
    { action: 'delete', resource: 'users' },
    { action: 'manage_roles', resource: 'users' },
    
    // Wetland management
    { action: 'create', resource: 'wetlands' },
    { action: 'read', resource: 'wetlands' },
    { action: 'update', resource: 'wetlands' },
    { action: 'delete', resource: 'wetlands' },
    
    // Sensor management
    { action: 'create', resource: 'sensors' },
    { action: 'read', resource: 'sensors' },
    { action: 'update', resource: 'sensors' },
    { action: 'delete', resource: 'sensors' },
    { action: 'configure', resource: 'sensors' },
    
    // System management
    { action: 'read', resource: 'system_logs' },
    { action: 'read', resource: 'audit_logs' },
    { action: 'manage', resource: 'system_settings' },
    { action: 'backup', resource: 'system' },
    
    // Analytics and reporting
    { action: 'read', resource: 'analytics' },
    { action: 'export', resource: 'data' },
    
    // Alerts
    { action: 'create', resource: 'alerts' },
    { action: 'read', resource: 'alerts' },
    { action: 'update', resource: 'alerts' },
    { action: 'delete', resource: 'alerts' },
    
    // Community reports
    { action: 'read', resource: 'community_reports' },
    { action: 'update', resource: 'community_reports' },
    { action: 'assign', resource: 'community_reports' },
    
    // Projects
    { action: 'create', resource: 'projects' },
    { action: 'read', resource: 'projects' },
    { action: 'update', resource: 'projects' },
    { action: 'delete', resource: 'projects' },
    { action: 'assign', resource: 'projects' },
  ],
  
  researcher: [
    // Wetland data
    { action: 'read', resource: 'wetlands' },
    { action: 'create', resource: 'observations' },
    { action: 'read', resource: 'observations' },
    { action: 'update', resource: 'observations' },
    
    // Sensor data
    { action: 'read', resource: 'sensors' },
    { action: 'read', resource: 'sensor_data' },
    
    // Analytics
    { action: 'read', resource: 'analytics' },
    { action: 'export', resource: 'research_data' },
    
    // Projects
    { action: 'create', resource: 'projects' },
    { action: 'read', resource: 'projects' },
    { action: 'update', resource: 'own_projects' },
    
    // Community reports (view and comment)
    { action: 'read', resource: 'community_reports' },
    { action: 'comment', resource: 'community_reports' },
  ],
  
  government_official: [
    // Wetland oversight
    { action: 'read', resource: 'wetlands' },
    { action: 'create', resource: 'wetlands' },
    { action: 'update', resource: 'wetlands' },
    
    // Regulatory data
    { action: 'read', resource: 'sensors' },
    { action: 'read', resource: 'sensor_data' },
    { action: 'read', resource: 'observations' },
    
    // Analytics and reporting
    { action: 'read', resource: 'analytics' },
    { action: 'export', resource: 'compliance_data' },
    
    // Community reports
    { action: 'read', resource: 'community_reports' },
    { action: 'update', resource: 'community_reports' },
    { action: 'assign', resource: 'community_reports' },
    
    // Projects oversight
    { action: 'read', resource: 'projects' },
    { action: 'approve', resource: 'projects' },
    
    // Alerts
    { action: 'read', resource: 'alerts' },
    { action: 'acknowledge', resource: 'alerts' },
  ],
  
  community_member: [
    // Basic wetland info
    { action: 'read', resource: 'wetlands_basic' },
    
    // Community reporting
    { action: 'create', resource: 'community_reports' },
    { action: 'read', resource: 'own_reports' },
    { action: 'update', resource: 'own_reports' },
    
    // Public data
    { action: 'read', resource: 'public_data' },
    
    // Educational content
    { action: 'read', resource: 'educational_content' },
  ],
};

// Dashboard sections available for each role
export const DASHBOARD_SECTIONS: Record<UserRole, string[]> = {
  admin: [
    'overview',
    'user_management',
    'wetland_management',
    'sensor_management',
    'system_monitoring',
    'analytics',
    'community_reports',
    'alerts',
    'projects',
    'settings',
    'audit_logs',
  ],
  
  researcher: [
    'overview',
    'research_data',
    'observations',
    'analytics',
    'projects',
    'community_reports',
  ],
  
  government_official: [
    'overview',
    'compliance',
    'wetlands',
    'analytics',
    'community_reports',
    'projects',
    'regulatory_reports',
  ],
  
  community_member: [
    'overview',
    'local_wetlands',
    'report_issue',
    'educational_resources',
  ],
};

// Permission checker utility
export const hasPermission = (
  userRole: UserRole,
  action: string,
  resource: string
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(
    (permission) =>
      permission.action === action && permission.resource === resource
  );
};

// Check if user can access dashboard section
export const canAccessSection = (
  userRole: UserRole,
  section: string
): boolean => {
  const sections = DASHBOARD_SECTIONS[userRole] || [];
  return sections.includes(section);
};

// Get allowed dashboard sections for user
export const getAllowedSections = (userRole: UserRole): string[] => {
  return DASHBOARD_SECTIONS[userRole] || [];
};

// Role hierarchy for privilege checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  government_official: 3,
  researcher: 2,
  community_member: 1,
};

// Check if user has higher or equal privilege
export const hasHigherOrEqualRole = (
  userRole: UserRole,
  requiredRole: UserRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Get user capabilities based on role
export const getUserCapabilities = (role: UserRole) => {
  return {
    canManageUsers: hasPermission(role, 'manage_roles', 'users'),
    canManageWetlands: hasPermission(role, 'delete', 'wetlands'),
    canManageSensors: hasPermission(role, 'configure', 'sensors'),
    canViewAnalytics: hasPermission(role, 'read', 'analytics'),
    canExportData: hasPermission(role, 'export', 'data'),
    canManageSystem: hasPermission(role, 'manage', 'system_settings'),
    canViewAuditLogs: hasPermission(role, 'read', 'audit_logs'),
    canAssignReports: hasPermission(role, 'assign', 'community_reports'),
    canManageProjects: hasPermission(role, 'delete', 'projects'),
  };
};