import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './screens/LoginScreen';
import { OperatorDashboard } from './screens/OperatorDashboard';
import { ManagerDashboard } from './screens/ManagerDashboard';
import { OwnerDashboard } from './screens/OwnerDashboard';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  const getDashboardComponent = () => {
    if (!currentUser) return LoginScreen;
    
    switch (currentUser.role) {
      case 'OWNER':
        return OwnerDashboard;
      case 'MANAGER':
        return ManagerDashboard;
      case 'OPERATOR':
        return OperatorDashboard;
      default:
        return LoginScreen;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen 
            name="Dashboard" 
            component={getDashboardComponent()} 
          />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh' as any,
      width: '100vw' as any,
    }),
  },
});

export default App;