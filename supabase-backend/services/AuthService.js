const { supabase, supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class AuthService {
  /**
   * Register a new user with Supabase Auth and create profile
   */
  async register(userData) {
    const { username, email, password, mobileNumber, role, petrolPumpId, deviceInfo } = userData;

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          mobile_number: mobileNumber,
          role,
          petrol_pump_id: petrolPumpId
        }
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          username,
          mobile_number: mobileNumber,
          role,
          petrol_pump_id: petrolPumpId,
          device_info: deviceInfo,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        // Cleanup: delete the auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          ...profileData
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login user with email/username and password
   */
  async login(credentials, deviceInfo) {
    const { username, password } = credentials;

    try {
      // Check if username is email or username
      const isEmail = username.includes('@');
      let email = username;

      if (!isEmail) {
        // Find user by username to get email
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (profileError || !profile) {
          throw new Error('Invalid credentials');
        }

        // Get email from auth.users
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        if (authError || !authUser.user) {
          throw new Error('Invalid credentials');
        }

        email = authUser.user.email;
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error('Invalid credentials');
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select(`
          *,
          petrol_pumps:petrol_pump_id (
            id,
            name,
            location,
            license_number
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        throw new Error('Profile not found');
      }

      // Update device info and last login
      if (deviceInfo) {
        await supabaseAdmin
          .from('user_profiles')
          .update({
            device_info: deviceInfo,
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id);
      }

      // Log audit event
      await this.logAuditEvent(authData.user.id, 'LOGIN', 'user_profiles', authData.user.id, null, null, deviceInfo);

      return {
        success: true,
        user: {
          id: profile.id,
          email: authData.user.email,
          username: profile.username,
          mobileNumber: profile.mobile_number,
          role: profile.role,
          petrolPumpId: profile.petrol_pump_id,
          petrolPump: profile.petrol_pumps,
          isActive: profile.is_active,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        },
        session: authData.session
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select(`
          *,
          petrol_pumps:petrol_pump_id (
            id,
            name,
            location,
            license_number
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error('Profile not found');
      }

      return {
        success: true,
        user: {
          id: profile.id,
          username: profile.username,
          mobileNumber: profile.mobile_number,
          role: profile.role,
          petrolPumpId: profile.petrol_pump_id,
          petrolPump: profile.petrol_pumps,
          isActive: profile.is_active,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      return {
        success: true,
        user: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, newPassword) {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        throw new Error(`Password change failed: ${error.message}`);
      }

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error('Invalid token');
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout user
   */
  async logout(userId, deviceInfo) {
    try {
      // Log audit event
      await this.logAuditEvent(userId, 'LOGOUT', 'user_profiles', userId, null, null, deviceInfo);

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(userId, action, entityType, entityId, oldValues = null, newValues = null, deviceInfo = null, ipAddress = null, userAgent = null) {
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          old_values: oldValues,
          new_values: newValues,
          device_info: deviceInfo,
          ip_address: ipAddress,
          user_agent: userAgent
        });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
}

module.exports = new AuthService();