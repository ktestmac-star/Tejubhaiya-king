import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { DatabaseService } from '../services/DatabaseService';
import { Alert, Shift } from '../types';

export const ManagerDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const databaseService = DatabaseService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alertsData, shiftsData] = await Promise.all([
        databaseService.getAlerts(),
        databaseService.getShifts()
      ]);
      setAlerts(alertsData);
      setShifts(shiftsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return '#e74c3c';
      case 'MEDIUM': return '#f39c12';
      case 'LOW': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CASH_DISCREPANCY': return '💰';
      case 'STOCK_MISMATCH': return '⛽';
      case 'SYSTEM_ERROR': return '⚠️';
      default: return '📋';
    }
  };

  const todayShifts = shifts.filter(shift => 
    new Date(shift.startTime).toDateString() === new Date().toDateString()
  );
  const activeShifts = shifts.filter(shift => shift.status === 'ACTIVE');
  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manager Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {currentUser?.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayShifts.length}</Text>
          <Text style={styles.statLabel}>Today's Shifts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeShifts.length}</Text>
          <Text style={styles.statLabel}>Active Shifts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{unresolvedAlerts.length}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      <View style={styles.alertsCard}>
        <Text style={styles.cardTitle}>Recent Alerts</Text>
        {unresolvedAlerts.length > 0 ? (
          unresolvedAlerts.slice(0, 5).map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertType}>{alert.type.replace('_', ' ')}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: getAlertColor(alert.severity) }]}>
                  <Text style={styles.severityText}>{alert.severity}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No active alerts</Text>
        )}
      </View>

      <View style={styles.shiftsCard}>
        <Text style={styles.cardTitle}>Today's Shifts</Text>
        {todayShifts.length > 0 ? (
          todayShifts.map((shift) => (
            <View key={shift.id} style={styles.shiftItem}>
              <View style={styles.shiftHeader}>
                <Text style={styles.shiftOperator}>Operator #{shift.operatorId}</Text>
                <View style={[styles.statusBadge, { 
                  backgroundColor: shift.status === 'ACTIVE' ? '#27ae60' : '#95a5a6' 
                }]}>
                  <Text style={styles.statusText}>{shift.status}</Text>
                </View>
              </View>
              <Text style={styles.shiftInfo}>
                Started: {new Date(shift.startTime).toLocaleTimeString()}
              </Text>
              <Text style={styles.shiftInfo}>
                Opening: {shift.openingReading}L
              </Text>
              {shift.closingReading && (
                <>
                  <Text style={styles.shiftInfo}>
                    Closing: {shift.closingReading}L
                  </Text>
                  <Text style={styles.shiftInfo}>
                    Fuel Sold: {shift.closingReading - shift.openingReading}L
                  </Text>
                  <Text style={styles.shiftInfo}>
                    Cash: ₹{shift.cashCollected}
                  </Text>
                </>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No shifts today</Text>
        )}
      </View>

      <View style={styles.featuresCard}>
        <Text style={styles.cardTitle}>Manager Features</Text>
        <Text style={styles.featureItem}>✅ Real-time Monitoring</Text>
        <Text style={styles.featureItem}>✅ Alert Management</Text>
        <Text style={styles.featureItem}>✅ Shift Oversight</Text>
        <Text style={styles.featureItem}>✅ Performance Analytics</Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  alertsCard: {
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
  shiftsCard: {
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
    marginBottom: 16,
  },
  alertItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  alertMessage: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  shiftItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftOperator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  shiftInfo: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  noDataText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  featureItem: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
  },
});