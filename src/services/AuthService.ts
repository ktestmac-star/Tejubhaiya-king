import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, AuthResult } from '../types';
import { DatabaseService } from './DatabaseService';

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async initialize(): Promise<void> {
    await this.databaseService.initialize();
    await this.loadStoredUser();
  }

  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const user = await this.databaseService.getUser(credentials.username, credentials.password);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      this.currentUser = user;
      await this.storeUser(user);

      return {
        success: true,
        user,
        token: `token_${user.id}_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem('current_user');
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  private async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  private async loadStoredUser(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    }
  }

  public getTestCredentials() {
    return [
      { username: 'owner', password: 'password123', role: 'OWNER' },
      { username: 'manager', password: 'password123', role: 'MANAGER' },
      { username: 'operator1', password: 'password123', role: 'OPERATOR' }
    ];
  }
}