import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/auth/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import Navigation from './components/layout/Navigation';
import { Dashboard } from './components/dashboard/Dashboard';
import { WetlandManagement } from './components/wetlands/WetlandManagement';
import { UserProfile } from './components/auth/UserProfile';
import { Settings } from './components/auth/Settings';
import { CommunityReporting } from './components/community/CommunityReporting';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Check system preference
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'wetlands':
        return <WetlandManagement />;
      case 'community':
        return <CommunityReporting />;
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AuthGuard>
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />

          <main className="container mx-auto px-4 py-8">
            {renderContent()}
          </main>

          <Toaster />
        </AuthGuard>
      </div>
    </AuthProvider>
  );
}