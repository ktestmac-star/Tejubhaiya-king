import { useState, useEffect } from 'react';
import { User, LoginCredentials, AuthenticationResult } from '../types';
import { AuthenticationService } from '../services/AuthenticationService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const authService = AuthenticationService.getInstance();

  useEffect(() => {
    // Check if user is already authenticated on app start
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthenticationResult> => {
    setIsLoading(true);
    try {
      const result = await authService.authenticate(credentials);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };
};