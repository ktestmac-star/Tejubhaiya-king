-- Manual Supabase Setup SQL
-- Run this in your Supabase SQL Editor if automatic setup fails

-- Create custom types
CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'OPERATOR');
CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC');
CREATE TYPE shift_type AS ENUM ('MORNING', 'EVENING', 'NIGHT');
CREATE TYPE shift_status AS ENUM ('ACTIVE', 'COMPLETED', 'FLAGGED');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW');
CREATE TYPE charging_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'OUT_OF_ORDER', 'MAINTENANCE');

-- Petrol Pumps table
CREATE TABLE petrol_pumps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  address JSONB,
  owner_id UUID REFERENCES auth.users(id),
  license_number VARCHAR(50) UNIQUE NOT NULL,
  contact_info JSONB,
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  mobile_number VARCHAR(15) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'OPERATOR',
  petrol_pump_id UUID REFERENCES petrol_pumps(id),
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispensers table
CREATE TABLE dispensers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispenser_code VARCHAR(20) NOT NULL,
  fuel_type fuel_type NOT NULL,
  petrol_pump_id UUID REFERENCES petrol_pumps(id) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL CHECK (current_price >= 0),
  capacity DECIMAL(10,2) NOT NULL CHECK (capacity >= 0),
  current_stock DECIMAL(10,2) DEFAULT 0 CHECK (current_stock >= 0),
  last_refill_date DATE,
  maintenance_schedule JSONB,
  calibration_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dispenser_code, petrol_pump_id)
);

-- Shifts table
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispenser_id UUID REFERENCES dispensers(id) NOT NULL,
  operator_id UUID REFERENCES auth.users(id) NOT NULL,
  shift_type shift_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  opening_reading DECIMAL(10,2) NOT NULL CHECK (opening_reading >= 0),
  closing_reading DECIMAL(10,2) CHECK (closing_reading >= opening_reading),
  fuel_sold DECIMAL(10,2) CHECK (fuel_sold >= 0),
  expected_cash DECIMAL(10,2) CHECK (expected_cash >= 0),
  actual_cash DECIMAL(10,2) DEFAULT 0 CHECK (actual_cash >= 0),
  digital_payments JSONB DEFAULT '{"upi": 0, "card": 0, "other": 0}',
  cash_used DECIMAL(10,2) DEFAULT 0 CHECK (cash_used >= 0),
  cash_usage_reason TEXT,
  discrepancy JSONB,
  status shift_status NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electric charging points table
CREATE TABLE charging_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  charging_point_code VARCHAR(20) NOT NULL,
  petrol_pump_id UUID REFERENCES petrol_pumps(id) NOT NULL,
  charging_type VARCHAR(20) NOT NULL, -- 'AC_SLOW', 'AC_FAST', 'DC_FAST', 'DC_ULTRA'
  power_rating DECIMAL(10,2) NOT NULL, -- in kW
  current_rate DECIMAL(10,2) NOT NULL CHECK (current_rate >= 0), -- per kWh
  connector_types JSONB, -- ['Type2', 'CCS', 'CHAdeMO']
  status charging_status DEFAULT 'AVAILABLE',
  total_energy_dispensed DECIMAL(15,3) DEFAULT 0,
  last_maintenance_date DATE,
  maintenance_schedule JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(charging_point_code, petrol_pump_id)
);

-- Daily fuel rates table for rate history and scheduling
CREATE TABLE daily_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petrol_pump_id UUID REFERENCES petrol_pumps(id) NOT NULL,
  fuel_type fuel_type NOT NULL,
  rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
  effective_date DATE NOT NULL,
  set_by UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(petrol_pump_id, fuel_type, effective_date)
);

-- Electric charging sessions table
CREATE TABLE charging_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  charging_point_id UUID REFERENCES charging_points(id) NOT NULL,
  operator_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_info JSONB, -- phone, vehicle details, etc.
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  energy_dispensed DECIMAL(10,3) CHECK (energy_dispensed >= 0), -- kWh
  rate_per_kwh DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
  payment_method VARCHAR(20), -- 'CASH', 'UPI', 'CARD', 'WALLET'
  payment_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED'
  session_status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'INTERRUPTED'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action audit_action NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_mobile ON user_profiles(mobile_number);
CREATE INDEX idx_user_profiles_pump_id ON user_profiles(petrol_pump_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

CREATE INDEX idx_dispensers_pump_id ON dispensers(petrol_pump_id);
CREATE INDEX idx_dispensers_code ON dispensers(dispenser_code);
CREATE INDEX idx_dispensers_fuel_type ON dispensers(fuel_type);

CREATE INDEX idx_charging_points_pump_id ON charging_points(petrol_pump_id);
CREATE INDEX idx_charging_points_code ON charging_points(charging_point_code);
CREATE INDEX idx_charging_points_status ON charging_points(status);

CREATE INDEX idx_daily_rates_pump_fuel ON daily_rates(petrol_pump_id, fuel_type);
CREATE INDEX idx_daily_rates_date ON daily_rates(effective_date);
CREATE INDEX idx_daily_rates_active ON daily_rates(is_active);

CREATE INDEX idx_charging_sessions_point_id ON charging_sessions(charging_point_id);
CREATE INDEX idx_charging_sessions_operator_id ON charging_sessions(operator_id);
CREATE INDEX idx_charging_sessions_start_time ON charging_sessions(start_time);
CREATE INDEX idx_charging_sessions_status ON charging_sessions(session_status);

CREATE INDEX idx_shifts_dispenser_id ON shifts(dispenser_id);
CREATE INDEX idx_shifts_operator_id ON shifts(operator_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_petrol_pumps_updated_at 
  BEFORE UPDATE ON petrol_pumps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispensers_updated_at 
  BEFORE UPDATE ON dispensers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at 
  BEFORE UPDATE ON shifts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charging_points_updated_at 
  BEFORE UPDATE ON charging_points 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charging_sessions_updated_at 
  BEFORE UPDATE ON charging_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate fuel sold trigger
CREATE OR REPLACE FUNCTION calculate_fuel_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.closing_reading IS NOT NULL AND NEW.opening_reading IS NOT NULL THEN
    NEW.fuel_sold = NEW.closing_reading - NEW.opening_reading;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_shifts_fuel_sold 
  BEFORE INSERT OR UPDATE ON shifts 
  FOR EACH ROW EXECUTE FUNCTION calculate_fuel_sold();

-- Enable Row Level Security
ALTER TABLE petrol_pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pump" ON petrol_pumps FOR SELECT USING (
  owner_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND petrol_pump_id = petrol_pumps.id)
);

CREATE POLICY "Users can view profiles in their pump" ON user_profiles FOR SELECT USING (
  id = auth.uid() OR
  petrol_pump_id IN (SELECT petrol_pump_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can view dispensers in their pump" ON dispensers FOR SELECT USING (
  petrol_pump_id IN (SELECT petrol_pump_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can view shifts in their pump" ON shifts FOR SELECT USING (
  operator_id = auth.uid() OR
  dispenser_id IN (
    SELECT d.id FROM dispensers d 
    JOIN user_profiles up ON d.petrol_pump_id = up.petrol_pump_id 
    WHERE up.id = auth.uid()
  )
);