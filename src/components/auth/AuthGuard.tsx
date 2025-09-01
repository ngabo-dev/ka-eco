import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {isLoginMode ? (
            <LoginForm onToggleMode={() => setIsLoginMode(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLoginMode(true)} />
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};