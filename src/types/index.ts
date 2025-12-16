// Core entity interfaces based on design document

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR'
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  CNG = 'CNG'
}

export enum ShiftType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT'
}

export enum ShiftStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FLAGGED = 'FLAGGED'
}

export interface User {
  id: string;
  username: string;
  employee_name: string;
  mobile_number: string;
  role: UserRole;
  petrol_pump_id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface PetrolPump {
  id: string;
  name: string;
  location: string;
  owner_id: string;
  petrol_pumps: number;
  diesel_pumps: number;
  cng_pumps: number;
  created_at: Date;
  updated_at: Date;
}

export interface Dispenser {
  id: string;
  dispenser_code: string;
  fuel_type: FuelType;
  petrol_pump_id: string;
  current_price: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Shift {
  id: string;
  dispenser_id: string;
  operator_id: string;
  machine_number: string;
  shift_type: ShiftType;
  start_time: Date;
  end_time?: Date;
  opening_reading: number;
  closing_reading?: number;
  fuel_sold?: number; // calculated field
  expected_cash?: number; // calculated field
  actual_cash?: number;
  digital_payments?: number;
  cash_used?: number;
  cash_usage_reason?: string;
  status: ShiftStatus;
  created_at: Date;
  updated_at: Date;
}

export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  SUPPLIES = 'SUPPLIES',
  UTILITIES = 'UTILITIES',
  TRANSPORT = 'TRANSPORT',
  FOOD = 'FOOD',
  MISCELLANEOUS = 'MISCELLANEOUS'
}

export interface Expense {
  id: string;
  employee_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt_url?: string;
  shift_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MachineSelection {
  id: string;
  employee_id: string;
  machine_number: string;
  selected_date: Date;
  shift_type: ShiftType;
  created_at: Date;
}

export interface EmployeePerformance {
  employee_id: string;
  employee_name: string;
  total_sales: number;
  total_expenses: number;
  expense_breakdown: { [key in ExpenseCategory]: number };
  shifts_completed: number;
  average_sales_per_shift: number;
  performance_score: number;
  period_start: Date;
  period_end: Date;
}

export interface PumpReading {
  id: string;
  pump_number: string;
  fuel_type: FuelType;
  current_reading: number;
  previous_reading: number;
  reading_date: Date;
  recorded_by: string;
  shift_id?: string;
  is_opening_reading: boolean;
  is_closing_reading: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: Date;
  ip_address?: string;
}

// Authentication related types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expires_at: Date;
  user: User;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Business logic types
export interface StockReading {
  dispenser_id: string;
  reading: number;
  timestamp: Date;
  operator_id: string;
}

export interface CashReconciliation {
  shift_id: string;
  expected_cash: number;
  actual_cash: number;
  digital_payments: number;
  cash_used: number;
  cash_usage_reason?: string;
  discrepancy: number;
}

export interface DiscrepancyAlert {
  id: string;
  shift_id: string;
  type: 'CASH' | 'STOCK' | 'TIMING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  threshold_exceeded: number;
  created_at: Date;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  manager_notes?: string;
}

export interface NotificationChannel {
  type: 'PUSH' | 'EMAIL' | 'SMS';
  recipient: string;
  enabled: boolean;
}

export interface EscalationRule {
  id: string;
  alert_type: 'CASH' | 'STOCK' | 'TIMING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  escalation_delay_minutes: number;
  escalation_recipients: string[];
  enabled: boolean;
}

export interface ManagerAnalysis {
  alert_id: string;
  variance_amount: number;
  variance_percentage: number;
  historical_comparison: {
    average_discrepancy: number;
    frequency_last_30_days: number;
    trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
  };
  recommended_actions: string[];
  risk_assessment: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Configuration management types
export interface DispenserConfiguration {
  id: string;
  dispenser_code: string;
  fuel_type: FuelType;
  petrol_pump_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ShiftTiming {
  id: string;
  shift_type: ShiftType;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  petrol_pump_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FuelPriceHistory {
  id: string;
  fuel_type: FuelType;
  price: number;
  effective_date: Date;
  petrol_pump_id: string;
  created_by: string;
  created_at: Date;
}

export interface SystemParameter {
  id: string;
  parameter_name: string;
  parameter_value: string;
  parameter_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  petrol_pump_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConfigurationUpdateRequest {
  dispenser_configurations?: DispenserConfiguration[];
  shift_timings?: ShiftTiming[];
  fuel_prices?: { fuel_type: FuelType; price: number }[];
  system_parameters?: { name: string; value: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' }[];
}