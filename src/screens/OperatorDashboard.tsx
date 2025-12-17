import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { DatabaseService } from '../services/DatabaseService';
import { Shift } from '../types';

export const OperatorDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [openingReading, setOpeningReading] = useState('');
  const [closingReading, setClosingReading] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const databaseService = DatabaseService.getInstance();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const startShift = async () => {
    if (!openingReading.trim()) {
      showAlert('Error', 'Please enter opening reading');
      return;
    }

    try {
      const shift = await databaseService.createShift({
        operatorId: currentUser!.id,
        startTime: new Date(),
        openingReading: parseFloat(openingReading),
        status: 'ACTIVE'
      });
      setCurrentShift(shift);
      showAlert('Success', 'Shift started successfully');
    } catch (error) {
      showAlert('Error', 'Failed to start shift');
    }
  };

  const endShift = async () => {
    if (!closingReading.trim() || !cashCollected.trim()) {
      showAlert('Error', 'Please enter closing reading and cash collected');
      return;
    }

    if (currentShift) {
      const updatedShift: Shift = {
        ...currentShift,
        endTime: new Date(),
        closingReading: parseFloat(closingReading),
        cashCollected: parseFloat(cashCollected),
        status: 'COMPLETED'
      };
      setCurrentShift(updatedShift);
      
      // Check for discrepancies
      const fuelSold = updatedShift.closingReading! - updatedShift.openingReading;
      const expectedCash = fuelSold * 100; // Assuming ₹100 per liter
      const actualCash = updatedShift.cashCollected!;
      
      if (Math.abs(expectedCash - actualCash) > 100) {
        await databaseService.createAlert({
          type: 'CASH_DISCREPANCY',
          severity: 'HIGH',
          message: `Cash discrepancy: Expected ₹${expectedCash}, Collected ₹${actualCash}`,
          shiftId: updatedShift.id,
          createdAt: new Date(),
          resolved: false
        });
      }
      
      showAlert('Success', 'Shift completed successfully');
      setOpeningReading('');
      setClosingReading('');
      setCashCollected('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Operator Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {currentUser?.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shiftCard}>
        <Text style={styles.cardTitle}>Current Shift</Text>
        {currentShift ? (
          <View>
            <Text style={styles.shiftStatus}>Status: {currentShift.status}</Text>
            <Text style={styles.shiftInfo}>Started: {currentShift.startTime.toLocaleTimeString()}</Text>
            <Text style={styles.shiftInfo}>Opening Reading: {currentShift.openingReading} L</Text>
            {currentShift.closingReading && (
              <>
                <Text style={styles.shiftInfo}>Closing Reading: {currentShift.closingReading} L</Text>
                <Text style={styles.shiftInfo}>Fuel Sold: {currentShift.closingReading - currentShift.openingReading} L</Text>
                <Text style={styles.shiftInfo}>Cash Collected: ₹{currentShift.cashCollected}</Text>
              </>
            )}
          </View>
        ) : (
          <Text style={styles.noShiftText}>No active shift</Text>
        )}
      </View>

      {!currentShift ? (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Start New Shift</Text>
          <TextInput
            style={styles.input}
            placeholder="Opening Reading (Liters)"
            value={openingReading}
            onChangeText={setOpeningReading}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={startShift}>
            <Text style={styles.primaryButtonText}>Start Shift</Text>
          </TouchableOpacity>
        </View>
      ) : currentShift.status === 'ACTIVE' ? (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>End Current Shift</Text>
          <TextInput
            style={styles.input}
            placeholder="Closing Reading (Liters)"
            value={closingReading}
            onChangeText={setClosingReading}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Cash Collected (₹)"
            value={cashCollected}
            onChangeText={setCashCollected}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.dangerButton} onPress={endShift}>
            <Text style={styles.dangerButtonText}>End Shift</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.featuresCard}>
        <Text style={styles.cardTitle}>Features Available</Text>
        <Text style={styles.featureItem}>✅ Shift Management</Text>
        <Text style={styles.featureItem}>✅ Reading Recording</Text>
        <Text style={styles.featureItem}>✅ Cash Reconciliation</Text>
        <Text style={styles.featureItem}>✅ Automatic Alerts</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  shiftCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  shiftStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 8,
  },
  shiftInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  noShiftText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureItem: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
  },
});