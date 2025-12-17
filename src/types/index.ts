export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export type UserRole = 'OWNER' | 'MANAGER' | 'OPERATOR';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface Shift {
  id: string;
  operatorId: string;
  startTime: Date;
  endTime?: Date;
  openingReading: number;
  closingReading?: number;
  cashCollected?: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Alert {
  id: string;
  type: 'CASH_DISCREPANCY' | 'STOCK_MISMATCH' | 'SYSTEM_ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  shiftId?: string;
  createdAt: Date;
  resolved: boolean;
}