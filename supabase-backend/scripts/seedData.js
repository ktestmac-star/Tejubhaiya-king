require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function seedData() {
  try {
    console.log('🌱 Seeding Supabase database with test data...');

    // Create sample petrol pump first
    const { data: petrolPump, error: pumpError } = await supabaseAdmin
      .from('petrol_pumps')
      .insert({
        name: 'City Fuel Station',
        location: 'Main Street, Downtown',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          coordinates: {
            latitude: 19.0760,
            longitude: 72.8777
          }
        },
        license_number: 'MH-2023-001',
        contact_info: {
          phone: '+91-9876543210',
          email: 'owner@cityfuel.com'
        },
        operating_hours: {
          open: '06:00',
          close: '22:00',
          is24Hours: false
        }
      })
      .select()
      .single();

    if (pumpError) {
      throw new Error(`Failed to create petrol pump: ${pumpError.message}`);
    }

    console.log('✅ Created petrol pump:', petrolPump.name);

    // Create users with Supabase Auth
    const users = [
      {
        email: 'owner@cityfuel.com',
        password: 'password123',
        username: 'owner',
        mobile_number: '9876543210',
        role: 'OWNER'
      },
      {
        email: 'manager@cityfuel.com',
        password: 'password123',
        username: 'manager',
        mobile_number: '9876543211',
        role: 'MANAGER'
      },
      {
        email: 'operator1@cityfuel.com',
        password: 'password123',
        username: 'operator1',
        mobile_number: '9876543212',
        role: 'OPERATOR'
      },
      {
        email: 'operator2@cityfuel.com',
        password: 'password123',
        username: 'operator2',
        mobile_number: '9876543213',
        role: 'OPERATOR'
      }
    ];

    const createdUsers = [];

    for (const userData of users) {
      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.username,
          role: userData.role
        }
      });

      if (authError) {
        console.error(`Failed to create auth user ${userData.username}:`, authError.message);
        continue;
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          username: userData.username,
          mobile_number: userData.mobile_number,
          role: userData.role,
          petrol_pump_id: petrolPump.id,
          device_info: {
            deviceId: `${userData.username}-device-001`,
            deviceName: `${userData.username} Phone`,
            platform: userData.role === 'OWNER' ? 'iOS' : 'Android',
            version: userData.role === 'OWNER' ? '16.0' : '13.0'
          }
        })
        .select()
        .single();

      if (profileError) {
        console.error(`Failed to create profile for ${userData.username}:`, profileError.message);
        // Cleanup auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        continue;
      }

      createdUsers.push({ auth: authUser.user, profile });
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    // Update petrol pump owner
    if (createdUsers.length > 0) {
      const owner = createdUsers.find(u => u.profile.role === 'OWNER');
      if (owner) {
        await supabaseAdmin
          .from('petrol_pumps')
          .update({ owner_id: owner.auth.id })
          .eq('id', petrolPump.id);
      }
    }

    // Create dispensers
    const dispensers = [
      {
        dispenser_code: 'P001',
        fuel_type: 'PETROL',
        petrol_pump_id: petrolPump.id,
        current_price: 102.50,
        capacity: 5000,
        current_stock: 3500,
        last_refill_date: '2024-01-15',
        maintenance_schedule: {
          lastMaintenance: '2024-01-01',
          nextMaintenance: '2024-04-01',
          maintenanceNotes: 'Regular quarterly maintenance'
        },
        calibration_data: {
          lastCalibration: '2024-01-01',
          calibrationCertificate: 'CERT-P001-2024',
          accuracy: 99.8
        }
      },
      {
        dispenser_code: 'D001',
        fuel_type: 'DIESEL',
        petrol_pump_id: petrolPump.id,
        current_price: 89.75,
        capacity: 8000,
        current_stock: 6200,
        last_refill_date: '2024-01-14',
        maintenance_schedule: {
          lastMaintenance: '2024-01-01',
          nextMaintenance: '2024-04-01',
          maintenanceNotes: 'Regular quarterly maintenance'
        },
        calibration_data: {
          lastCalibration: '2024-01-01',
          calibrationCertificate: 'CERT-D001-2024',
          accuracy: 99.9
        }
      },
      {
        dispenser_code: 'P002',
        fuel_type: 'PETROL',
        petrol_pump_id: petrolPump.id,
        current_price: 102.50,
        capacity: 5000,
        current_stock: 4100,
        last_refill_date: '2024-01-16',
        maintenance_schedule: {
          lastMaintenance: '2024-01-01',
          nextMaintenance: '2024-04-01',
          maintenanceNotes: 'Regular quarterly maintenance'
        },
        calibration_data: {
          lastCalibration: '2024-01-01',
          calibrationCertificate: 'CERT-P002-2024',
          accuracy: 99.7
        }
      },
      {
        dispenser_code: 'C001',
        fuel_type: 'CNG',
        petrol_pump_id: petrolPump.id,
        current_price: 75.20,
        capacity: 3000,
        current_stock: 2100,
        last_refill_date: '2024-01-17',
        maintenance_schedule: {
          lastMaintenance: '2024-01-01',
          nextMaintenance: '2024-04-01',
          maintenanceNotes: 'Regular quarterly maintenance'
        },
        calibration_data: {
          lastCalibration: '2024-01-01',
          calibrationCertificate: 'CERT-C001-2024',
          accuracy: 99.5
        }
      }
    ];

    const { data: createdDispensers, error: dispenserError } = await supabaseAdmin
      .from('dispensers')
      .insert(dispensers)
      .select();

    if (dispenserError) {
      console.error('Failed to create dispensers:', dispenserError.message);
    } else {
      console.log(`✅ Created ${createdDispensers.length} dispensers`);
    }

    // Create electric charging points
    const chargingPoints = [
      {
        charging_point_code: 'EV001',
        petrol_pump_id: petrolPump.id,
        charging_type: 'AC_FAST',
        power_rating: 22.0,
        current_rate: 12.50,
        connector_types: ['Type2', 'CCS'],
        status: 'AVAILABLE'
      },
      {
        charging_point_code: 'EV002',
        petrol_pump_id: petrolPump.id,
        charging_type: 'DC_FAST',
        power_rating: 50.0,
        current_rate: 18.00,
        connector_types: ['CCS', 'CHAdeMO'],
        status: 'AVAILABLE'
      },
      {
        charging_point_code: 'EV003',
        petrol_pump_id: petrolPump.id,
        charging_type: 'DC_ULTRA',
        power_rating: 150.0,
        current_rate: 25.00,
        connector_types: ['CCS'],
        status: 'AVAILABLE'
      }
    ];

    const { data: createdChargingPoints, error: chargingError } = await supabaseAdmin
      .from('charging_points')
      .insert(chargingPoints)
      .select();

    if (chargingError) {
      console.error('Failed to create charging points:', chargingError.message);
    } else {
      console.log(`✅ Created ${createdChargingPoints.length} electric charging points`);
    }

    // Create initial daily rates
    const today = new Date().toISOString().split('T')[0];
    const dailyRates = [
      {
        petrol_pump_id: petrolPump.id,
        fuel_type: 'PETROL',
        rate: 102.50,
        effective_date: today,
        set_by: createdUsers.find(u => u.profile.role === 'OWNER')?.auth.id,
        notes: 'Initial rate setup'
      },
      {
        petrol_pump_id: petrolPump.id,
        fuel_type: 'DIESEL',
        rate: 89.75,
        effective_date: today,
        set_by: createdUsers.find(u => u.profile.role === 'OWNER')?.auth.id,
        notes: 'Initial rate setup'
      },
      {
        petrol_pump_id: petrolPump.id,
        fuel_type: 'CNG',
        rate: 75.20,
        effective_date: today,
        set_by: createdUsers.find(u => u.profile.role === 'OWNER')?.auth.id,
        notes: 'Initial rate setup'
      }
    ];

    const { data: createdRates, error: ratesError } = await supabaseAdmin
      .from('daily_rates')
      .insert(dailyRates)
      .select();

    if (ratesError) {
      console.error('Failed to create daily rates:', ratesError.message);
    } else {
      console.log(`✅ Created ${createdRates.length} daily rate records`);
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Owner: owner@cityfuel.com / password123');
    console.log('Manager: manager@cityfuel.com / password123');
    console.log('Operator1: operator1@cityfuel.com / password123');
    console.log('Operator2: operator2@cityfuel.com / password123');
    console.log('\n📍 Petrol Pump ID:', petrolPump.id);
    console.log('⛽ Dispensers: P001 (Petrol), D001 (Diesel), P002 (Petrol), C001 (CNG)');
    console.log('🔌 Charging Points: EV001 (22kW AC), EV002 (50kW DC), EV003 (150kW DC Ultra)');
    console.log('💰 Daily rates set for all fuel types');
    console.log('\n💡 You can also login with usernames: owner, manager, operator1, operator2');

  } catch (error) {
    console.error('❌ Seed data creation failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Supabase configuration in .env');
    console.log('2. Ensure database schema is set up (run: npm run setup)');
    console.log('3. Verify your Supabase service role key has admin permissions');
  }
}

// Run seed data if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;