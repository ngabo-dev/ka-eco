import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthContext';
import {
  BarChart3,
  MapPin,
  Settings as SettingsIcon,
  LogOut,
  User,
  Users,
  Droplets,
  Menu,
  Sun,
  Moon
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

interface ProfileDropdownProps {
  user: any;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  navigationItems: any[];
  activeTab: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onTabChange,
  onLogout,
  navigationItems,
  activeTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 220;
      const dropdownHeight = 200; // approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 8;

      // Ensure dropdown doesn't go off-screen horizontally
      if (left < 8) {
        left = 8;
      } else if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8;
      }

      // Ensure dropdown doesn't go off-screen vertically
      if (top + dropdownHeight > viewportHeight - 8) {
        top = rect.top - dropdownHeight - 8;
      }

      setDropdownPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.right - 220
        });
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="profile-dropdown-container">
      <div ref={buttonRef} className="relative inline-block">
        <Button
          variant="ghost"
          size="sm"
          className="relative h-11 w-11 rounded-full hover:bg-gradient-to-br hover:from-accent hover:to-accent/80 hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          title="User menu"
          onClick={handleToggle}
        >
          <Avatar className="h-9 w-9 hover:ring-3 hover:ring-primary/30 transition-all duration-300 group-hover:shadow-md">
            <AvatarImage src={''} alt={user?.username} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>

      {isOpen && (
        <div
          className="profile-dropdown-menu open"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-user-info">
              <p className="profile-dropdown-username">{user?.username}</p>
              <span className="profile-dropdown-status">
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="profile-dropdown-email">{user?.email}</p>
          </div>

          <div className="profile-dropdown-menu-items">
            <div
              onClick={() => handleMenuClick(() => onTabChange('profile'))}
              className="profile-dropdown-menu-item"
            >
              <User className="profile-dropdown-menu-item-icon" />
              <span>Profile</span>
            </div>

            <div
              onClick={() => handleMenuClick(() => onTabChange('settings'))}
              className="profile-dropdown-menu-item"
            >
              <SettingsIcon className="profile-dropdown-menu-item-icon" />
              <span>Settings</span>
            </div>

            <div
              onClick={() => handleMenuClick(() => onTabChange('community'))}
              className="profile-dropdown-menu-item"
            >
              <Users className="profile-dropdown-menu-item-icon" />
              <span>Community</span>
            </div>

            <div className="profile-dropdown-separator"></div>

            <div
              onClick={() => handleMenuClick(onLogout)}
              className="profile-dropdown-menu-item profile-dropdown-menu-item-logout"
            >
              <LogOut className="profile-dropdown-menu-item-icon" />
              <span>Log out</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, darkMode, onToggleDarkMode }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'wetlands', label: 'Wetlands', icon: Droplets },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            className="hidden sm:flex"
          >
            {darkMode ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          {/* User Profile */}
          <ProfileDropdown
            user={user}
            onTabChange={onTabChange}
            onLogout={handleLogout}
            navigationItems={navigationItems}
            activeTab={activeTab}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;