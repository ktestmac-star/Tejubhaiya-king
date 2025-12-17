import { Platform } from 'react-native';
import { User, Shift, Alert } from '../types';

// Simple database service that works on both mobile and web
export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      this.initializeWebStorage();
    } else {
      // For mobile, we'll use AsyncStorage for simplicity
      console.log('Database initialized for mobile');
    }
  }

  private initializeWebStorage(): void {
    // Initialize with default users if not exists
    if (!localStorage.getItem('tracko_users')) {
      const defaultUsers: User[] = [
        {
          id: '1',
          username: 'owner',
          email: 'owner@tracko.com',
          role: 'OWNER',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@tracko.com',
          role: 'MANAGER',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: '3',
          username: 'operator1',
          email: 'operator1@tracko.com',
          role: 'OPERATOR',
          isActive: true,
          createdAt: new Date(),
        },
      ];
      localStorage.setItem('tracko_users', JSON.stringify(defaultUsers));
    }

    // Initialize shifts and alerts
    if (!localStorage.getItem('tracko_shifts')) {
      localStorage.setItem('tracko_shifts', JSON.stringify([]));
    }
    if (!localStorage.getItem('tracko_alerts')) {
      localStorage.setItem('tracko_alerts', JSON.stringify([]));
    }
  }

  public async getUser(username: string, password: string): Promise<User | null> {
    if (Platform.OS === 'web') {
      const users: User[] = JSON.parse(localStorage.getItem('tracko_users') || '[]');
      return users.find(u => u.username === username && password === 'password123') || null;
    } else {
      // Mobile implementation would use SQLite here
      const users: User[] = [
        { id: '1', username: 'owner', email: 'owner@tracko.com', role: 'OWNER', isActive: true, createdAt: new Date() },
        { id: '2', username: 'manager', email: 'manager@tracko.com', role: 'MANAGER', isActive: true, createdAt: new Date() },
        { id: '3', username: 'operator1', email: 'operator1@tracko.com', role: 'OPERATOR', isActive: true, createdAt: new Date() },
      ];
      return users.find(u => u.username === username && password === 'password123') || null;
    }
  }

  public async getShifts(): Promise<Shift[]> {
    if (Platform.OS === 'web') {
      return JSON.parse(localStorage.getItem('tracko_shifts') || '[]');
    } else {
      // Mock data for mobile
      return [
        {
          id: '1',
          operatorId: '3',
          startTime: new Date(),
          openingReading: 1000,
          closingReading: 1150,
          cashCollected: 7500,
          status: 'COMPLETED'
        }
      ];
    }
  }

  public async getAlerts(): Promise<Alert[]> {
    if (Platform.OS === 'web') {
      return JSON.parse(localStorage.getItem('tracko_alerts') || '[]');
    } else {
      // Mock data for mobile
      return [
        {
          id: '1',
          type: 'CASH_DISCREPANCY',
          severity: 'HIGH',
          message: '₹500 shortage in shift #123',
          createdAt: new Date(),
          resolved: false
        }
      ];
    }
  }

  public async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const newShift: Shift = {
      ...shift,
      id: Date.now().toString()
    };

    if (Platform.OS === 'web') {
      const shifts = await this.getShifts();
      shifts.push(newShift);
      localStorage.setItem('tracko_shifts', JSON.stringify(shifts));
    }

    return newShift;
  }

  public async createAlert(alert: Omit<Alert, 'id'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString()
    };

    if (Platform.OS === 'web') {
      const alerts = await this.getAlerts();
      alerts.push(newAlert);
      localStorage.setItem('tracko_alerts', JSON.stringify(alerts));
    }

    return newAlert;
  }
}