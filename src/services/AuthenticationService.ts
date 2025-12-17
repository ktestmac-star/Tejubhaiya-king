import { User, UserRole, LoginCredentials, AuthenticationResult, AuthToken } from '../types';
import { ValidationUtils } from '../utils/ValidationUtils';
import { ErrorHandlingUtils, ErrorType, ErrorSeverity, AppError } from '../utils/ErrorHandlingUtils';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceUtils } from '../utils/DeviceUtils';

export interface SecurityConfig {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  enableBiometric: boolean;
}

export interface AuthEvent {
  type: 'loginAttempt' | 'sessionExpired' | 'accessRevoked';
  userId?: string;
  username?: string;
  success?: boolean;
  timestamp: Date;
  reason?: string;
}

export class AuthenticationService {
  private static instance: AuthenticationService;
  private databaseService: any;
  private currentUser: User | null = null;
  private currentToken: string | null = null;
  private revokedUsers: Set<string> = new Set(); // Track revoked user IDs
  private activeSessions: Map<string, { userId: string; token: string; timestamp: number }> = new Map(); // Track active sessions
  private securityConfig: SecurityConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly CURRENT_USER_KEY = 'current_user';
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    // Import DatabaseService dynamically to avoid circular dependencies
    import('./DatabaseService').then(({ DatabaseService }) => {
      this.databaseService = DatabaseService.getInstance();
    });
    
    this.securityConfig = {
      sessionTimeoutMinutes: 30,
      maxLoginAttempts: 3,
      passwordMinLength: 8,
      enableBiometric: true
    };
    
    // Set up session timeout monitoring
    this.setupSessionMonitoring();
    
    // Load stored user data
    this.loadStoredUser();
  }

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthenticationResult> {
    // Check login attempts
    const attemptKey = credentials.username.toLowerCase();
    const attempts = this.loginAttempts.get(attemptKey);
    
    if (attempts && attempts.count >= this.securityConfig.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      const lockoutTime = 15 * 60 * 1000; // 15 minutes
      
      if (timeSinceLastAttempt < lockoutTime) {
        const event: AuthEvent = {
          type: 'loginAttempt',
          username: credentials.username,
          success: false,
          timestamp: new Date(),
          reason: 'Account locked due to too many failed attempts'
        };
        console.log('Auth Event:', event);
        
        return {
          success: false,
          error: 'Account temporarily locked. Please try again later.'
        };
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.delete(attemptKey);
      }
    }

    try {
      // Validate username
      const usernameValidation = ValidationUtils.validateUsername(credentials.username);
      if (!usernameValidation.isValid) {
        throw new Error(`Please enter a valid username: ${usernameValidation.errors.join(', ')}`);
      }

      // Validate password
      const passwordValidation = ValidationUtils.validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Please enter a valid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Get device info
      const deviceInfo = await DeviceUtils.getDeviceInfo();

      // Call API service for authentication
      const response = await this.apiService.login({
        username: credentials.username,
        password: credentials.password,
        deviceInfo
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Convert API user to internal User type
        const internalUser: User = {
          id: user._id,
          username: user.username,
          employee_name: user.username, // Use username as employee name for now
          mobile_number: user.mobileNumber,
          role: user.role as UserRole,
          petrol_pump_id: user.petrolPumpId._id || user.petrolPumpId,
          created_at: new Date(user.createdAt),
          updated_at: new Date(user.updatedAt),
          is_active: user.isActive
        };

        // Check if user access has been revoked
        if (this.revokedUsers.has(internalUser.id)) {
          throw new Error('Your access has been revoked. Please contact your administrator.');
        }

        // Check if user is active
        if (!internalUser.is_active) {
          throw new Error('Your account is currently inactive. Please contact your administrator.');
        }

        this.currentUser = internalUser;
        this.currentToken = token;

        // Store user data locally
        await this.storeUserData(internalUser);

        // Track active session
        this.activeSessions.set(token, {
          userId: internalUser.id,
          token: token,
          timestamp: Date.now()
        });

        // Clear login attempts on successful login
        this.loginAttempts.delete(attemptKey);
        
        const event: AuthEvent = {
          type: 'loginAttempt',
          userId: internalUser.id,
          username: credentials.username,
          success: true,
          timestamp: new Date()
        };
        console.log('Auth Event:', event);
        
        return {
          success: true,
          user: internalUser,
          token: token
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Track failed login attempt
      const currentAttempts = this.loginAttempts.get(attemptKey) || { count: 0, lastAttempt: new Date() };
      currentAttempts.count++;
      currentAttempts.lastAttempt = new Date();
      this.loginAttempts.set(attemptKey, currentAttempts);
      
      const event: AuthEvent = {
        type: 'loginAttempt',
        username: credentials.username,
        success: false,
        timestamp: new Date(),
        reason: errorMessage
      };
      console.log('Auth Event:', event);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  isAuthenticated(): boolean {
    if (this.currentUser === null || this.currentToken === null) {
      return false;
    }
    
    // Check if current user's access has been revoked
    if (this.revokedUsers.has(this.currentUser.id)) {
      this.logout(); // Immediately terminate session
      return false;
    }
    
    // Check if current token is still in active sessions
    if (!this.activeSessions.has(this.currentToken)) {
      this.logout(); // Session was terminated
      return false;
    }
    
    return true;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
  }

  canAccessFunction(requiredRoles: UserRole[]): boolean {
    if (!this.isAuthenticated() || !this.currentUser) {
      return false;
    }
    
    // Double-check access hasn't been revoked
    if (this.revokedUsers.has(this.currentUser.id)) {
      return false;
    }
    
    return requiredRoles.includes(this.currentUser.role);
  }

  async logout(): Promise<void> {
    try {
      // Call API service to logout
      if (this.currentToken) {
        await this.apiService.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }

    // Remove from active sessions if token exists
    if (this.currentToken) {
      this.activeSessions.delete(this.currentToken);
    }
    
    // Clear stored user data
    await this.clearStoredUserData();
    
    this.currentUser = null;
    this.currentToken = null;
  }

  /**
   * Revoke access for a specific user - immediately terminates all active sessions
   * and prevents future access attempts
   */
  revokeUserAccess(userId: string): void {
    // Add user to revoked list
    this.revokedUsers.add(userId);
    
    // Immediately terminate all active sessions for this user
    const sessionsToTerminate: string[] = [];
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        sessionsToTerminate.push(token);
      }
    }
    
    // Remove all sessions for the revoked user
    for (const token of sessionsToTerminate) {
      this.activeSessions.delete(token);
    }
    
    // If the current user is the one being revoked, logout immediately
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = null;
      this.currentToken = null;
    }
    
    // Log access revoked event
    const event: AuthEvent = {
      type: 'accessRevoked',
      userId: userId,
      timestamp: new Date(),
      reason: 'User access revoked by administrator'
    };
    console.log('Auth Event:', event);
  }

  /**
   * Restore access for a previously revoked user
   */
  restoreUserAccess(userId: string): void {
    this.revokedUsers.delete(userId);
  }

  /**
   * Check if a user's access has been revoked
   */
  isUserAccessRevoked(userId: string): boolean {
    return this.revokedUsers.has(userId);
  }

  /**
   * Get all active sessions (for testing/monitoring purposes)
   */
  getActiveSessions(): Array<{ userId: string; token: string; timestamp: number }> {
    return Array.from(this.activeSessions.values());
  }

  private generateToken(user: User): string {
    // Simple token generation - in real implementation, use JWT
    const payload = {
      userId: user.id,
      role: user.role,
      pumpId: user.petrol_pump_id,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(payload));
  }

  validateToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token));
      return payload.userId && payload.role && payload.timestamp;
    } catch {
      return false;
    }
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
  }

  /**
   * Get current security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Set up session timeout monitoring
   */
  private setupSessionMonitoring(): void {
    setInterval(() => {
      this.checkSessionTimeouts();
    }, 60000); // Check every minute
  }

  /**
   * Check for expired sessions and clean them up
   */
  private checkSessionTimeouts(): void {
    const now = Date.now();
    const timeoutMs = this.securityConfig.sessionTimeoutMinutes * 60 * 1000;
    
    const expiredSessions: string[] = [];
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (now - session.timestamp > timeoutMs) {
        expiredSessions.push(token);
        
        const event: AuthEvent = {
          type: 'sessionExpired',
          userId: session.userId,
          timestamp: new Date(),
          reason: 'Session timeout'
        };
        console.log('Auth Event:', event);
      }
    }
    
    // Remove expired sessions
    for (const token of expiredSessions) {
      this.activeSessions.delete(token);
      
      // If current session expired, logout
      if (this.currentToken === token) {
        this.currentUser = null;
        this.currentToken = null;
        this.clearStoredUserData();
      }
    }
  }

  /**
   * Store user data locally
   */
  private async storeUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  /**
   * Load stored user data
   */
  private async loadStoredUser(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        // Verify the user is still authenticated with the API
        const isAuthenticated = await this.apiService.isAuthenticated();
        if (isAuthenticated) {
          this.currentUser = user;
        } else {
          await this.clearStoredUserData();
        }
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
      await this.clearStoredUserData();
    }
  }

  /**
   * Clear stored user data
   */
  private async clearStoredUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
    } catch (error) {
      console.error('Failed to clear stored user data:', error);
    }
  }

  /**
   * Initialize the service (call this on app startup)
   */
  public async initialize(): Promise<void> {
    await this.loadStoredUser();
  }
}