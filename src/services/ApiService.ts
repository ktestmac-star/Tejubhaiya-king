import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    platform: string;
    version: string;
  };
}

export interface LoginResponse {
  user: any;
  token: string;
  expiresIn: string;
}

export class ApiService {
  private static instance: ApiService;
  private config: ApiConfig;

  private constructor() {
    this.config = {
      baseURL: __DEV__ ? 'http://localhost:3001/api' : 'https://your-production-api.com/api',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Set API configuration
   */
  public setConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get stored authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Store authentication token
   */
  private async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  /**
   * Remove authentication token
   */
  private async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    // Note: Connectivity checking could be added here if needed

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers
    };

    let lastError: Error;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`API Request (attempt ${attempt}):`, {
          method: options.method || 'GET',
          url,
          headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseData = await response.json();

        console.log(`API Response (${response.status}):`, responseData);

        if (!response.ok) {
          // Handle authentication errors
          if (response.status === 401) {
            await this.removeAuthToken();
            throw new Error('Authentication failed');
          }
          
          throw new Error(responseData.message || `HTTP ${response.status}`);
        }

        return responseData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`API request failed (attempt ${attempt}):`, error);

        // Don't retry on authentication errors
        if (lastError.message === 'Authentication failed') {
          throw lastError;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError!;
  }

  /**
   * Authentication methods
   */
  public async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      },
      false
    );

    if (response.success && response.data?.token) {
      await this.setAuthToken(response.data.token);
    }

    return response;
  }

  public async logout(): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest('/auth/logout', {
        method: 'POST'
      });
      
      await this.removeAuthToken();
      return response;
    } catch (error) {
      // Even if logout fails on server, remove local token
      await this.removeAuthToken();
      throw error;
    }
  }

  public async getProfile(): Promise<ApiResponse> {
    return this.makeRequest('/auth/profile');
  }

  public async updateProfile(data: any): Promise<ApiResponse> {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.makeRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Shift management methods
   */
  public async getShifts(pumpId: string, params: any = {}): Promise<ApiResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/shifts/pump/${pumpId}${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint);
  }

  public async getShift(shiftId: string): Promise<ApiResponse> {
    return this.makeRequest(`/shifts/${shiftId}`);
  }

  public async startShift(data: any): Promise<ApiResponse> {
    return this.makeRequest('/shifts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async endShift(shiftId: string, data: any): Promise<ApiResponse> {
    return this.makeRequest(`/shifts/${shiftId}/end`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public async resolveShiftDiscrepancy(shiftId: string, reason: string): Promise<ApiResponse> {
    return this.makeRequest(`/shifts/${shiftId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  public async getShiftStats(pumpId: string, params: any = {}): Promise<ApiResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/shifts/pump/${pumpId}/stats${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health', {}, false);
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    try {
      const response = await this.getProfile();
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process offline queue (placeholder for future implementation)
   */
  public async processOfflineQueue(): Promise<void> {
    // Note: Offline queue processing would be implemented here
    console.log('Processing offline queue...');
  }
}