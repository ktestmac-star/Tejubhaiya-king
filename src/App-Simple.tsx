import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSimpleAuth } from './hooks/useSimpleAuth';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { isAuthenticated, currentUser, isLoading, login, logout, getTestCredentials } = useSimpleAuth();

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
        setUsername('');
        setPassword('');
      } else {
        showAlert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      showAlert('Error', 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUsername('');
    setPassword('');
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Initializing Tracko...</Text>
      </View>
    );
  }

  if (isAuthenticated && currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Tracko</Text>
          <Text style={styles.subtitle}>SQLite-based Management System</Text>
          
          <View style={styles.userCard}>
            <Text style={styles.userText}>Logged in as: {currentUser.username}</Text>
            <Text style={styles.roleText}>Role: {currentUser.role}</Text>
            <Text style={styles.roleText}>ID: {currentUser.id}</Text>
          </View>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>✅ Available Features:</Text>
            <Text style={styles.featureItem}>• SQLite Database</Text>
            <Text style={styles.featureItem}>• User Authentication</Text>
            <Text style={styles.featureItem}>• Cross-platform Support</Text>
            <Text style={styles.featureItem}>• Offline-first Design</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const testCredentials = getTestCredentials();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Tracko Login</Text>
        <Text style={styles.subtitle}>SQLite-based Petrol Pump Management</Text>
        
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      minHeight: '100%' as any,
      width: '100%' as any,
    }),
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  testCredentialsCard: {
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
  testCredentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#27ae60',
  },
  credentialItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  credentialText: {
    fontSize: 12,
    color: '#2c3e50',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loginCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3498db',
    padding: 15,
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
  userCard: {
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
    color: '#3498db',
    marginBottom: 3,
  },
  featuresCard: {
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

export default App;