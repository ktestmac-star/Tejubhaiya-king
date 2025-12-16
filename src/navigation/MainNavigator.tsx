import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';

export const MainNavigator: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tracko</Text>
      <Text style={styles.subtitle}>Petrol Pump Management System</Text>
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Logged in as: {user.username}</Text>
          <Text style={styles.roleText}>Role: {user.role}</Text>
          <Text style={styles.pumpText}>Pump ID: {user.petrol_pump_id}</Text>
        </View>
      )}

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>✅ Available Features:</Text>
        <Text style={styles.featureItem}>• Multi-device authentication</Text>
        <Text style={styles.featureItem}>• Supabase backend integration</Text>
        <Text style={styles.featureItem}>• Dispenser management API</Text>
        <Text style={styles.featureItem}>• Electric charging system API</Text>
        <Text style={styles.featureItem}>• Daily fuel rate management</Text>
        <Text style={styles.featureItem}>• Real-time data synchronization</Text>
      </View>

      <View style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>🚀 Next Steps:</Text>
        <Text style={styles.nextStepItem}>1. Set up Supabase project</Text>
        <Text style={styles.nextStepItem}>2. Run database setup script</Text>
        <Text style={styles.nextStepItem}>3. Build management UI screens</Text>
        <Text style={styles.nextStepItem}>4. Deploy to production</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#2c3e50',
  },
  roleText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#3498db',
  },
  pumpText: {
    fontSize: 14,
    color: '#95a5a6',
  },
  features: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#27ae60',
  },
  featureItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#2c3e50',
  },
  nextSteps: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#e74c3c',
  },
  nextStepItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#2c3e50',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});