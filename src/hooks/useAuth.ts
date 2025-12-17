import { useState, useEffect } from 'react';
import { User, LoginCredentials, AuthResult } from '../types';
import { AuthService } from '../services/AuthService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authService = AuthService.getInstance();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await authService.initialize();
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const result = await authService.login(credentials);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getTestCredentials = () => {
    return authService.getTestCredentials();
  };

  return {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout,
    getTestCredentials
  };
};