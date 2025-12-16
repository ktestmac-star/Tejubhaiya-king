import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = __DEV__ 
  ? 'https://your-project.supabase.co' // Replace with your Supabase URL
  : 'https://your-production-project.supabase.co';

const supabaseAnonKey = __DEV__
  ? 'your-anon-key' // Replace with your Supabase anon key
  : 'your-production-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (you can generate these from Supabase CLI)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          mobile_number: string;
          role: 'OWNER' | 'MANAGER' | 'OPERATOR';
          petrol_pump_id: string;
          device_info: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          mobile_number: string;
          role?: 'OWNER' | 'MANAGER' | 'OPERATOR';
          petrol_pump_id: string;
          device_info?: any;
          is_active?: boolean;
        };
        Update: {
          username?: string;
          mobile_number?: string;
          role?: 'OWNER' | 'MANAGER' | 'OPERATOR';
          petrol_pump_id?: string;
          device_info?: any;
          is_active?: boolean;
        };
      };
      petrol_pumps: {
        Row: {
          id: string;
          name: string;
          location: string;
          address: any;
          owner_id: string;
          license_number: string;
          contact_info: any;
          operating_hours: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      dispensers: {
        Row: {
          id: string;
          dispenser_code: string;
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG';
          petrol_pump_id: string;
          current_price: number;
          capacity: number;
          current_stock: number;
          last_refill_date: string;
          maintenance_schedule: any;
          calibration_data: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          dispenser_id: string;
          operator_id: string;
          shift_type: 'MORNING' | 'EVENING' | 'NIGHT';
          start_time: string;
          end_time: string | null;
          opening_reading: number;
          closing_reading: number | null;
          fuel_sold: number | null;
          expected_cash: number | null;
          actual_cash: number;
          digital_payments: any;
          cash_used: number;
          cash_usage_reason: string | null;
          discrepancy: any | null;
          status: 'ACTIVE' | 'COMPLETED' | 'FLAGGED';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}