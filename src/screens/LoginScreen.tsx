import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, getTestCredentials } = useAuth();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      console.log(`${title}: ${message}`);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Error', 'Please enter username and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login({ username, password });
      if (result.success) {
        showAlert('Success', 'Login successful!');
      } else {
        showAlert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      showAlert('Error', 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const testCredentials = getTestCredentials();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🏪 Tracko</Text>
        <Text style={styles.subtitle}>Petrol Pump Management System</Text>
      </View>

      <View style={styles.testCredentialsCard}>
        <Text style={styles.testCredentialsTitle}>🔑 Test Credentials (tap to use):</Text>
        {testCredentials.map((cred, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.credentialItem}
            onPress={() => {
              setUsername(cred.username);
              setPassword(cred.password);
            }}
          >
            <Text style={styles.credentialText}>
              {cred.role}: {cred.username} / {cred.password}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.loginCard}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!isLoggingIn}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoggingIn}
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  testCredentialsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testCredentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#27ae60',
  },
  credentialItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  credentialText: {
    fontSize: 13,
    color: '#2c3e50',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loginCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});