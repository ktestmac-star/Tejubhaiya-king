const { supabaseAdmin } = require('../config/supabase');
const AuthService = require('./AuthService');

class ChargingService {
  /**
   * Get all charging points for a petrol pump
   */
  async getChargingPoints(pumpId, includeInactive = false) {
    try {
      let query = supabaseAdmin
        .from('charging_points')
        .select('*')
        .eq('petrol_pump_id', pumpId)
        .order('charging_point_code');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: chargingPoints, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch charging points: ${error.message}`);
      }

      return {
        success: true,
        data: chargingPoints
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add new charging point
   */
  async addChargingPoint(chargingPointData, userId) {
    try {
      const {
        chargingPointCode,
        petrolPumpId,
        chargingType,
        powerRating,
        currentRate,
        connectorTypes = []
      } = chargingPointData;

      // Check if charging point code already exists for this pump
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('charging_points')
        .select('id')
        .eq('charging_point_code', chargingPointCode)
        .eq('petrol_pump_id', petrolPumpId)
        .single();

      if (existing) {
        throw new Error('Charging point code already exists for this petrol pump');
      }

      // Create new charging point
      const { data: newChargingPoint, error: insertError } = await supabaseAdmin
        .from('charging_points')
        .insert({
          charging_point_code: chargingPointCode,
          petrol_pump_id: petrolPumpId,
          charging_type: chargingType,
          power_rating: powerRating,
          current_rate: currentRate,
          connector_types: connectorTypes,
          status: 'AVAILABLE',
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to add charging point: ${insertError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'CREATE', 'charging_points', newChargingPoint.id, null, newChargingPoint);

      return {
        success: true,
        data: newChargingPoint,
        message: 'Charging point added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update charging point details
   */
  async updateChargingPoint(chargingPointId, updates, userId) {
    try {
      // Get current charging point
      const { data: currentChargingPoint, error: fetchError } = await supabaseAdmin
        .from('charging_points')
        .select('*')
        .eq('id', chargingPointId)
        .single();

      if (fetchError || !currentChargingPoint) {
        throw new Error('Charging point not found');
      }

      // Update charging point
      const { data: updatedChargingPoint, error: updateError } = await supabaseAdmin
        .from('charging_points')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', chargingPointId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update charging point: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'charging_points', chargingPointId, currentChargingPoint, updatedChargingPoint);

      return {
        success: true,
        data: updatedChargingPoint,
        message: 'Charging point updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete/deactivate charging point
   */
  async deleteChargingPoint(chargingPointId, userId) {
    try {
      // Check if charging point has active sessions
      const { data: activeSessions, error: sessionError } = await supabaseAdmin
        .from('charging_sessions')
        .select('id')
        .eq('charging_point_id', chargingPointId)
        .eq('session_status', 'ACTIVE');

      if (activeSessions && activeSessions.length > 0) {
        throw new Error('Cannot delete charging point with active sessions');
      }

      // Get current charging point
      const { data: currentChargingPoint, error: fetchError } = await supabaseAdmin
        .from('charging_points')
        .select('*')
        .eq('id', chargingPointId)
        .single();

      if (fetchError || !currentChargingPoint) {
        throw new Error('Charging point not found');
      }

      // Soft delete (deactivate)
      const { data: updatedChargingPoint, error: updateError } = await supabaseAdmin
        .from('charging_points')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', chargingPointId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to delete charging point: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'DELETE', 'charging_points', chargingPointId, currentChargingPoint, updatedChargingPoint);

      return {
        success: true,
        message: 'Charging point deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start charging session
   */
  async startChargingSession(sessionData, userId) {
    try {
      const {
        chargingPointId,
        customerInfo,
        ratePerKwh
      } = sessionData;

      // Check if charging point is available
      const { data: chargingPoint, error: pointError } = await supabaseAdmin
        .from('charging_points')
        .select('*')
        .eq('id', chargingPointId)
        .eq('status', 'AVAILABLE')
        .single();

      if (pointError || !chargingPoint) {
        throw new Error('Charging point not available');
      }

      // Create new charging session
      const { data: newSession, error: insertError } = await supabaseAdmin
        .from('charging_sessions')
        .insert({
          charging_point_id: chargingPointId,
          operator_id: userId,
          customer_info: customerInfo,
          start_time: new Date().toISOString(),
          rate_per_kwh: ratePerKwh || chargingPoint.current_rate,
          session_status: 'ACTIVE'
        })
        .select(`
          *,
          charging_points:charging_point_id (
            charging_point_code,
            charging_type,
            power_rating
          )
        `)
        .single();

      if (insertError) {
        throw new Error(`Failed to start charging session: ${insertError.message}`);
      }

      // Update charging point status
      await supabaseAdmin
        .from('charging_points')
        .update({ status: 'OCCUPIED' })
        .eq('id', chargingPointId);

      // Log audit event
      await AuthService.logAuditEvent(userId, 'CREATE', 'charging_sessions', newSession.id, null, newSession);

      return {
        success: true,
        data: newSession,
        message: 'Charging session started successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * End charging session
   */
  async endChargingSession(sessionId, endData, userId) {
    try {
      const {
        energyDispensed,
        paymentMethod,
        paymentStatus = 'COMPLETED'
      } = endData;

      // Get current session
      const { data: currentSession, error: fetchError } = await supabaseAdmin
        .from('charging_sessions')
        .select(`
          *,
          charging_points:charging_point_id (
            id,
            total_energy_dispensed
          )
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError || !currentSession) {
        throw new Error('Charging session not found');
      }

      if (currentSession.session_status !== 'ACTIVE') {
        throw new Error('Only active sessions can be ended');
      }

      // Calculate total amount
      const totalAmount = energyDispensed * currentSession.rate_per_kwh;

      // Update session
      const { data: updatedSession, error: updateError } = await supabaseAdmin
        .from('charging_sessions')
        .update({
          end_time: new Date().toISOString(),
          energy_dispensed: energyDispensed,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          session_status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select(`
          *,
          charging_points:charging_point_id (
            charging_point_code,
            charging_type,
            power_rating
          )
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to end charging session: ${updateError.message}`);
      }

      // Update charging point status and total energy dispensed
      await supabaseAdmin
        .from('charging_points')
        .update({
          status: 'AVAILABLE',
          total_energy_dispensed: currentSession.charging_points.total_energy_dispensed + energyDispensed
        })
        .eq('id', currentSession.charging_point_id);

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'charging_sessions', sessionId, currentSession, updatedSession);

      return {
        success: true,
        data: updatedSession,
        message: 'Charging session ended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get charging sessions for a petrol pump
   */
  async getChargingSessions(pumpId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        operatorId,
        startDate,
        endDate
      } = filters;

      let query = supabaseAdmin
        .from('charging_sessions')
        .select(`
          *,
          charging_points:charging_point_id!inner (
            id,
            charging_point_code,
            charging_type,
            power_rating,
            petrol_pump_id
          ),
          user_profiles:operator_id (
            id,
            username,
            mobile_number
          )
        `)
        .eq('charging_points.petrol_pump_id', pumpId)
        .order('start_time', { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq('session_status', status);
      }

      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      if (startDate) {
        query = query.gte('start_time', startDate);
      }

      if (endDate) {
        query = query.lte('start_time', endDate);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: sessions, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch charging sessions: ${error.message}`);
      }

      return {
        success: true,
        data: {
          sessions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
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
   * Get charging statistics
   */
  async getChargingStats(pumpId, filters = {}) {
    try {
      const { startDate, endDate, operatorId } = filters;

      let query = supabaseAdmin
        .from('charging_sessions')
        .select(`
          energy_dispensed,
          total_amount,
          session_status,
          charging_points:charging_point_id!inner (
            petrol_pump_id
          )
        `)
        .eq('charging_points.petrol_pump_id', pumpId)
        .eq('session_status', 'COMPLETED');

      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      if (startDate) {
        query = query.gte('start_time', startDate);
      }

      if (endDate) {
        query = query.lte('start_time', endDate);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch charging statistics: ${error.message}`);
      }

      // Calculate statistics
      const stats = sessions.reduce((acc, session) => {
        acc.totalSessions += 1;
        acc.totalEnergyDispensed += session.energy_dispensed || 0;
        acc.totalRevenue += session.total_amount || 0;
        return acc;
      }, {
        totalSessions: 0,
        totalEnergyDispensed: 0,
        totalRevenue: 0
      });

      // Calculate derived statistics
      stats.avgEnergyPerSession = stats.totalSessions > 0 ? stats.totalEnergyDispensed / stats.totalSessions : 0;
      stats.avgRevenuePerSession = stats.totalSessions > 0 ? stats.totalRevenue / stats.totalSessions : 0;

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update charging point status
   */
  async updateChargingPointStatus(chargingPointId, status, userId) {
    try {
      // Get current charging point
      const { data: currentChargingPoint, error: fetchError } = await supabaseAdmin
        .from('charging_points')
        .select('*')
        .eq('id', chargingPointId)
        .single();

      if (fetchError || !currentChargingPoint) {
        throw new Error('Charging point not found');
      }

      // Update status
      const { data: updatedChargingPoint, error: updateError } = await supabaseAdmin
        .from('charging_points')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', chargingPointId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update charging point status: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'charging_points', chargingPointId, 
        { status: currentChargingPoint.status }, 
        { status: status }
      );

      return {
        success: true,
        data: updatedChargingPoint,
        message: 'Charging point status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ChargingService();