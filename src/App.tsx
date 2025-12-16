import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './navigation/AppNavigator';
import { AuthenticationService } from './services/AuthenticationService';
import { ApiService } from './services/ApiService';

function App(): JSX.Element {
  useEffect(() => {
    // Initialize services on app startup
    const initializeServices = async () => {
      try {
        // Initialize authentication service
        const authService = AuthenticationService.getInstance();
        await authService.initialize();
        
        // Initialize API service
        const apiService = ApiService.getInstance();
        
        console.log('Services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}

export default App;