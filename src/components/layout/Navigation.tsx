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
      const dropdownWidth = 256; // w-64 = 256px
      const dropdownHeight = 200; // approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 8;

      // Ensure dropdown doesn't go off-screen horizontally
      if (left < 8) {
        left = rect.left; // Position to the right of the button if not enough space on left
      }
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8;
      }

      // Ensure dropdown doesn't go off-screen vertically
      if (top + dropdownHeight > viewportHeight - 8) {
        top = rect.top - dropdownHeight - 8; // Position above if not enough space below
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div ref={buttonRef}>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-11 w-11 rounded-full hover:bg-blue-100 hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          title="User menu"
          onClick={handleToggle}
        >
          <Avatar className="h-9 w-9 ring-2 ring-blue-300 transition-all duration-300 group-hover:shadow-md">
            <AvatarImage src={''} alt={user?.username} />
            <AvatarFallback className="bg-blue-200 text-blue-800 font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
      {isOpen && (
        <div
          className="profile-dropdown-menu"
          style={{
            top: `${Math.max(8, Math.min(dropdownPosition.top, window.innerHeight - 208))}px`,
            left: `${Math.max(8, Math.min(dropdownPosition.left, window.innerWidth - 272))}px`
          }}
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900 dark:text-white text-base">{user?.username}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                user?.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300">{user?.email}</p>
          </div>
          <div className="py-2">
            <button
              onClick={() => handleMenuClick(() => onTabChange('profile'))}
              className="flex items-center w-full px-5 py-3 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors rounded-lg"
            >
              <User className="mr-3 w-5 h-5 text-gray-500 dark:text-gray-400" />
              Profile
            </button>
            <button
              onClick={() => handleMenuClick(() => onTabChange('settings'))}
              className="flex items-center w-full px-5 py-3 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors rounded-lg"
            >
              <SettingsIcon className="mr-3 w-5 h-5 text-gray-500 dark:text-gray-400" />
              Settings
            </button>
            <button
              onClick={() => handleMenuClick(() => onTabChange('community'))}
              className="flex items-center w-full px-5 py-3 text-gray-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors rounded-lg"
            >
              <Users className="mr-3 w-5 h-5 text-gray-500 dark:text-gray-400" />
              Community
            </button>
            <hr className="border-t border-gray-100 dark:border-gray-600 my-2" />
            <button
              onClick={() => handleMenuClick(onLogout)}
              className="flex items-center w-full px-5 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors rounded-lg font-semibold"
            >
              <LogOut className="mr-3 w-5 h-5 text-red-500 dark:text-red-400" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, darkMode, onToggleDarkMode }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'wetlands', label: 'Wetlands', icon: Droplets },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleMobileNavClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Mobile menu button clicked');
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            onTouchStart={(e) => {
              console.log('Mobile menu touch start');
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="mobile-menu-button"
            aria-label="Toggle mobile menu"
          >
            <Menu className="size-5 text-foreground" />
            <span className="text-sm font-medium text-foreground">Menu</span>
          </button>
        </div>

        {/* Navigation Links - Desktop */}
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
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle - Always visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            className="flex items-center justify-center"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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

      {/* Mobile Navigation Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={(e) => {
              console.log('Backdrop clicked');
              setMobileMenuOpen(false);
            }}
            onTouchStart={(e) => {
              console.log('Backdrop touch start');
              setMobileMenuOpen(false);
            }}
            style={{ touchAction: 'manipulation' }}
          />

          {/* Mobile Menu */}
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50 md:hidden">
            <div className="px-4 py-3">
              <div className="flex flex-col space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Mobile nav clicked: ${item.id}`);
                        handleMobileNavClick(item.id);
                      }}
                      onTouchStart={(e) => {
                        console.log(`Mobile nav touch start: ${item.id}`);
                        handleMobileNavClick(item.id);
                      }}
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                      aria-label={`Navigate to ${item.label}`}
                    >
                      <Icon className="size-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navigation;