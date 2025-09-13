import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './components/auth/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import Navigation from './components/layout/Navigation';
import { Toaster } from './components/ui/sonner';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const WetlandManagement = lazy(() => import('./components/wetlands/WetlandManagement').then(module => ({ default: module.WetlandManagement })));
const UserProfile = lazy(() => import('./components/auth/UserProfile').then(module => ({ default: module.UserProfile })));
const Settings = lazy(() => import('./components/auth/Settings').then(module => ({ default: module.Settings })));
const CommunityReporting = lazy(() => import('./components/community/CommunityReporting').then(module => ({ default: module.CommunityReporting })));

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
    const LoadingFallback = () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
      case 'wetlands':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WetlandManagement />
          </Suspense>
        );
      case 'community':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CommunityReporting />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <UserProfile />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
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