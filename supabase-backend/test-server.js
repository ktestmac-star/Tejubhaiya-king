// Simple test server for immediate testing without Supabase setup
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockUsers = {
  'test': {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'test',
    role: 'OWNER',
    mobileNumber: '1234567890',
    petrolPumpId: 'test-pump-id',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'owner': {
    id: 'owner-user-id',
    email: 'owner@cityfuel.com',
    username: 'owner',
    role: 'OWNER',
    mobileNumber: '9876543210',
    petrolPumpId: 'test-pump-id',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Test endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Supabase test server is running',
    timestamp: new Date().toISOString(),
    database: 'Mock data (no Supabase required)',
    note: 'This is a test server. For full functionality, set up Supabase and use the main server.'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Mock authentication
  const user = mockUsers[username];
  if (user && password === 'password123') {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token: `mock-jwt-token-${username}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${username}`,
        expiresIn: 3600
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token && token.startsWith('mock-jwt-token')) {
    const username = token.includes('owner') ? 'owner' : 'test';
    const user = mockUsers[username];
    
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Mock dispensers endpoints
app.get('/api/dispensers/pump/:pumpId', (req, res) => {
  const mockDispensers = [
    {
      id: 'dispenser-1',
      dispenser_code: 'P001',
      fuel_type: 'PETROL',
      current_price: 102.50,
      capacity: 5000,
      current_stock: 3500,
      is_active: true
    },
    {
      id: 'dispenser-2',
      dispenser_code: 'D001',
      fuel_type: 'DIESEL',
      current_price: 89.75,
      capacity: 8000,
      current_stock: 6200,
      is_active: true
    },
    {
      id: 'dispenser-3',
      dispenser_code: 'C001',
      fuel_type: 'CNG',
      current_price: 75.20,
      capacity: 3000,
      current_stock: 2100,
      is_active: true
    }
  ];

  res.json({
    success: true,
    data: mockDispensers
  });
});

app.post('/api/dispensers', (req, res) => {
  const { dispenserCode, fuelType, currentPrice, capacity } = req.body;
  
  const newDispenser = {
    id: `dispenser-${Date.now()}`,
    dispenser_code: dispenserCode,
    fuel_type: fuelType,
    current_price: currentPrice,
    capacity: capacity,
    current_stock: 0,
    is_active: true
  };

  res.status(201).json({
    success: true,
    message: 'Dispenser added successfully',
    data: newDispenser
  });
});

app.post('/api/dispensers/pump/:pumpId/rates', (req, res) => {
  const { rates } = req.body;
  
  res.json({
    success: true,
    message: 'Daily rates set successfully',
    data: rates.map(rate => ({
      id: `rate-${Date.now()}-${rate.fuelType}`,
      fuel_type: rate.fuelType,
      rate: rate.price,
      effective_date: new Date().toISOString().split('T')[0],
      notes: rate.notes
    }))
  });
});

// Mock charging points endpoints
app.get('/api/charging/pump/:pumpId/points', (req, res) => {
  const mockChargingPoints = [
    {
      id: 'charging-1',
      charging_point_code: 'EV001',
      charging_type: 'AC_FAST',
      power_rating: 22.0,
      current_rate: 12.50,
      connector_types: ['Type2', 'CCS'],
      status: 'AVAILABLE',
      is_active: true
    },
    {
      id: 'charging-2',
      charging_point_code: 'EV002',
      charging_type: 'DC_FAST',
      power_rating: 50.0,
      current_rate: 18.00,
      connector_types: ['CCS', 'CHAdeMO'],
      status: 'AVAILABLE',
      is_active: true
    }
  ];

  res.json({
    success: true,
    data: mockChargingPoints
  });
});

app.post('/api/charging/points', (req, res) => {
  const { chargingPointCode, chargingType, powerRating, currentRate } = req.body;
  
  const newChargingPoint = {
    id: `charging-${Date.now()}`,
    charging_point_code: chargingPointCode,
    charging_type: chargingType,
    power_rating: powerRating,
    current_rate: currentRate,
    status: 'AVAILABLE',
    is_active: true
  };

  res.status(201).json({
    success: true,
    message: 'Charging point added successfully',
    data: newChargingPoint
  });
});

app.post('/api/charging/sessions', (req, res) => {
  const { chargingPointId, customerInfo } = req.body;
  
  const newSession = {
    id: `session-${Date.now()}`,
    charging_point_id: chargingPointId,
    customer_info: customerInfo,
    start_time: new Date().toISOString(),
    session_status: 'ACTIVE',
    charging_points: {
      charging_point_code: 'EV001',
      charging_type: 'AC_FAST'
    }
  };

  res.status(201).json({
    success: true,
    message: 'Charging session started successfully',
    data: newSession
  });
});

// Mock shifts endpoints
app.get('/api/shifts/pump/:pumpId', (req, res) => {
  const mockShifts = [
    {
      id: 'shift-1',
      dispenserId: 'dispenser-1',
      operatorId: 'operator-1',
      shiftType: 'MORNING',
      startTime: new Date().toISOString(),
      status: 'ACTIVE',
      openingReading: 1000.5,
      dispensers: {
        dispenserCode: 'P001',
        fuelType: 'PETROL'
      },
      user_profiles: {
        username: 'operator1'
      }
    }
  ];

  res.json({
    success: true,
    data: {
      shifts: mockShifts,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      }
    }
  });
});

app.post('/api/shifts', (req, res) => {
  const { dispenserId, shiftType, openingReading } = req.body;
  
  const newShift = {
    id: `shift-${Date.now()}`,
    dispenserId,
    shiftType,
    openingReading,
    startTime: new Date().toISOString(),
    status: 'ACTIVE',
    dispensers: {
      dispenserCode: 'P001',
      fuelType: 'PETROL'
    }
  };

  res.status(201).json({
    success: true,
    message: 'Shift started successfully',
    data: newShift
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Supabase Test Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Test credentials:`);
  console.log(`   - test / password123`);
  console.log(`   - owner / password123`);
  console.log('');
  console.log('🎯 Features available in test mode:');
  console.log('   ✅ Authentication & user management');
  console.log('   ✅ Dispenser management (add/edit/delete)');
  console.log('   ✅ Daily fuel rate setting');
  console.log('   ✅ Electric charging point management');
  console.log('   ✅ Charging session tracking');
  console.log('   ✅ Shift management');
  console.log('');
  console.log('📖 For full Supabase functionality, see SUPABASE_SETUP_GUIDE.md');
  console.log('🚀 To start full server: npm run dev (after Supabase setup)');
});

module.exports = app;