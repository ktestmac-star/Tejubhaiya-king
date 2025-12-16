const { supabaseAdmin } = require('../config/supabase');
const AuthService = require('./AuthService');

class ShiftService {
  /**
   * Get shifts for a petrol pump with pagination and filters
   */
  async getShifts(pumpId, filters = {}) {
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
        .from('shifts')
        .select(`
          *,
          dispensers:dispenser_id (
            id,
            dispenser_code,
            fuel_type,
            current_price
          ),
          user_profiles:operator_id (
            id,
            username,
            mobile_number
          )
        `)
        .eq('dispensers.petrol_pump_id', pumpId)
        .order('start_time', { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
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

      const { data: shifts, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch shifts: ${error.message}`);
      }

      return {
        success: true,
        data: {
          shifts,
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
   * Get shift by ID
   */
  async getShiftById(shiftId) {
    try {
      const { data: shift, error } = await supabaseAdmin
        .from('shifts')
        .select(`
          *,
          dispensers:dispenser_id (
            id,
            dispenser_code,
            fuel_type,
            current_price,
            petrol_pumps:petrol_pump_id (
              id,
              name,
              location
            )
          ),
          user_profiles:operator_id (
            id,
            username,
            mobile_number
          )
        `)
        .eq('id', shiftId)
        .single();

      if (error) {
        throw new Error('Shift not found');
      }

      return {
        success: true,
        data: shift
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start a new shift
   */
  async startShift(shiftData, userId) {
    try {
      const { dispenserId, shiftType, openingReading, notes } = shiftData;

      // Check if there's already an active shift for this dispenser
      const { data: activeShift, error: checkError } = await supabaseAdmin
        .from('shifts')
        .select('id')
        .eq('dispenser_id', dispenserId)
        .eq('status', 'ACTIVE')
        .single();

      if (activeShift) {
        throw new Error('There is already an active shift for this dispenser');
      }

      // Verify dispenser exists and user has access
      const { data: dispenser, error: dispenserError } = await supabaseAdmin
        .from('dispensers')
        .select(`
          id,
          petrol_pump_id,
          current_price,
          petrol_pumps:petrol_pump_id (
            id,
            name
          )
        `)
        .eq('id', dispenserId)
        .single();

      if (dispenserError || !dispenser) {
        throw new Error('Dispenser not found');
      }

      // Create new shift
      const { data: newShift, error: insertError } = await supabaseAdmin
        .from('shifts')
        .insert({
          dispenser_id: dispenserId,
          operator_id: userId,
          shift_type: shiftType,
          start_time: new Date().toISOString(),
          opening_reading: openingReading,
          notes,
          status: 'ACTIVE'
        })
        .select(`
          *,
          dispensers:dispenser_id (
            id,
            dispenser_code,
            fuel_type,
            current_price
          ),
          user_profiles:operator_id (
            id,
            username,
            mobile_number
          )
        `)
        .single();

      if (insertError) {
        throw new Error(`Failed to start shift: ${insertError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'CREATE', 'shifts', newShift.id, null, newShift);

      return {
        success: true,
        data: newShift,
        message: 'Shift started successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * End a shift
   */
  async endShift(shiftId, endData, userId) {
    try {
      const {
        closingReading,
        actualCash = 0,
        digitalPayments = {},
        cashUsed = 0,
        cashUsageReason,
        notes
      } = endData;

      // Get current shift
      const { data: currentShift, error: fetchError } = await supabaseAdmin
        .from('shifts')
        .select(`
          *,
          dispensers:dispenser_id (
            id,
            current_price
          )
        `)
        .eq('id', shiftId)
        .single();

      if (fetchError || !currentShift) {
        throw new Error('Shift not found');
      }

      if (currentShift.status !== 'ACTIVE') {
        throw new Error('Only active shifts can be ended');
      }

      if (closingReading < currentShift.opening_reading) {
        throw new Error('Closing reading cannot be less than opening reading');
      }

      // Calculate fuel sold and expected cash
      const fuelSold = closingReading - currentShift.opening_reading;
      const expectedCash = fuelSold * currentShift.dispensers.current_price;

      // Calculate total digital payments
      const totalDigitalPayments = (digitalPayments.upi || 0) + 
                                  (digitalPayments.card || 0) + 
                                  (digitalPayments.other || 0);

      // Check for discrepancies
      const totalReceived = actualCash + totalDigitalPayments;
      const expectedTotal = expectedCash - cashUsed;
      const discrepancyAmount = totalReceived - expectedTotal;

      let status = 'COMPLETED';
      let discrepancy = null;

      if (Math.abs(discrepancyAmount) > 1) { // Allow for small rounding differences
        status = 'FLAGGED';
        discrepancy = {
          amount: discrepancyAmount,
          reason: discrepancyAmount > 0 ? 'Excess cash' : 'Cash shortage',
          resolved: false
        };
      }

      // Update shift
      const { data: updatedShift, error: updateError } = await supabaseAdmin
        .from('shifts')
        .update({
          end_time: new Date().toISOString(),
          closing_reading: closingReading,
          fuel_sold: fuelSold,
          expected_cash: expectedCash,
          actual_cash: actualCash,
          digital_payments: digitalPayments,
          cash_used: cashUsed,
          cash_usage_reason: cashUsageReason,
          notes,
          status,
          discrepancy,
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId)
        .select(`
          *,
          dispensers:dispenser_id (
            id,
            dispenser_code,
            fuel_type,
            current_price
          ),
          user_profiles:operator_id (
            id,
            username,
            mobile_number
          )
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to end shift: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'shifts', shiftId, currentShift, updatedShift);

      return {
        success: true,
        data: updatedShift,
        message: 'Shift ended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve shift discrepancy
   */
  async resolveDiscrepancy(shiftId, reason, userId) {
    try {
      // Get current shift
      const { data: currentShift, error: fetchError } = await supabaseAdmin
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();

      if (fetchError || !currentShift) {
        throw new Error('Shift not found');
      }

      if (currentShift.status !== 'FLAGGED') {
        throw new Error('Only flagged shifts can be resolved');
      }

      // Update discrepancy resolution
      const updatedDiscrepancy = {
        ...currentShift.discrepancy,
        resolved: true,
        reason: reason,
        resolved_by: userId,
        resolved_at: new Date().toISOString()
      };

      const { data: updatedShift, error: updateError } = await supabaseAdmin
        .from('shifts')
        .update({
          discrepancy: updatedDiscrepancy,
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to resolve discrepancy: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'shifts', shiftId, currentShift, updatedShift);

      return {
        success: true,
        data: updatedShift,
        message: 'Shift discrepancy resolved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get shift statistics
   */
  async getShiftStats(pumpId, filters = {}) {
    try {
      const { startDate, endDate, operatorId } = filters;

      let query = supabaseAdmin
        .from('shifts')
        .select(`
          fuel_sold,
          expected_cash,
          actual_cash,
          digital_payments,
          cash_used,
          status,
          dispensers:dispenser_id!inner (
            petrol_pump_id
          )
        `)
        .eq('dispensers.petrol_pump_id', pumpId)
        .in('status', ['COMPLETED', 'FLAGGED']);

      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      if (startDate) {
        query = query.gte('start_time', startDate);
      }

      if (endDate) {
        query = query.lte('start_time', endDate);
      }

      const { data: shifts, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch statistics: ${error.message}`);
      }

      // Calculate statistics
      const stats = shifts.reduce((acc, shift) => {
        acc.totalShifts += 1;
        acc.totalFuelSold += shift.fuel_sold || 0;
        acc.totalExpectedCash += shift.expected_cash || 0;
        acc.totalActualCash += shift.actual_cash || 0;
        acc.totalCashUsed += shift.cash_used || 0;

        const digitalPayments = shift.digital_payments || {};
        acc.totalDigitalPayments += (digitalPayments.upi || 0) + 
                                   (digitalPayments.card || 0) + 
                                   (digitalPayments.other || 0);

        if (shift.status === 'FLAGGED') {
          acc.flaggedShifts += 1;
        }

        return acc;
      }, {
        totalShifts: 0,
        totalFuelSold: 0,
        totalExpectedCash: 0,
        totalActualCash: 0,
        totalDigitalPayments: 0,
        totalCashUsed: 0,
        flaggedShifts: 0
      });

      // Calculate derived statistics
      stats.avgFuelPerShift = stats.totalShifts > 0 ? stats.totalFuelSold / stats.totalShifts : 0;
      stats.totalDiscrepancy = (stats.totalActualCash + stats.totalDigitalPayments) - 
                              (stats.totalExpectedCash - stats.totalCashUsed);

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
}

module.exports = new ShiftService();