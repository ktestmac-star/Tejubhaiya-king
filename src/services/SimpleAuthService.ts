import { User, UserRole, LoginCredentials, AuthenticationResult } from '../types';
import { DatabaseService } from './DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceUtils } from '../utils/DeviceUtils';

export class SimpleAuthService {
  private static instance: SimpleAuthService;
  private databaseService: DatabaseService;
  private currentUser: User | null = null;
  private readonly CURRENT_USER_KEY = 'current_user';

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  public static getInstance(): SimpleAuthService {
    if (!SimpleAuthService.instance) {
      SimpleAuthService.instance = new SimpleAuthService();
    }
    return SimpleAuthService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.databaseService.initialize();
      await this.loadStoredUser();
      console.log('SimpleAuthService initialized successfully');
    } catch (error) {
      console.error('SimpleAuthService initialization failed:', error);
      throw error;
    }
  }

  public async login(credentials: LoginCredentials): Promise<AuthenticationResult> {
    try {
      // Validate input
      if (!credentials.username || !credentials.password) {
        return {
          success: false,
          error: 'Please enter both username and password'
        };
      }

      // Get device info
      const deviceInfo = await DeviceUtils.getDeviceInfo();

      // Query user from database
      const result = await this.databaseService.executeSql(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND isActive = 1',
        [credentials.username, credentials.username]
      );

      if (result[0].rows.length === 0) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const userData = result[0].rows.item(0);

      // Simple password check (in real app, use proper hashing)
      if (userData.password !== credentials.password) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Create user object
      const user: User = {
        id: userData.id,
        username: userData.username,
        employee_name: userData.username,
        mobile_number: userData.email, // Using email as mobile for simplicity
        role: userData.role as UserRole,
        petrol_pump_id: '1', // Default pump ID
        created_at: new Date(userData.createdAt),
        updated_at: new Date(userData.updatedAt || userData.createdAt),
        is_active: userData.isActive === 1
      };

      this.currentUser = user;

      // Store user data locally
      await this.storeUserData(user);

      return {
        success: true,
        user: user,
        token: `token_${user.id}_${Date.now()}` // Simple token generation
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  public async logout(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  private async storeUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  private async loadStoredUser(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    }
  }

  // Get test credentials for demo
  public getTestCredentials(): Array<{ username: string; password: string; role: string }> {
    return [
      { username: 'owner', password: 'password123', role: 'OWNER' },
      { username: 'manager', password: 'password123', role: 'MANAGER' },
      { username: 'operator1', password: 'password123', role: 'OPERATOR' }
    ];
  }
}