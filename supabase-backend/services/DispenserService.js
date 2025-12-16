const { supabaseAdmin } = require('../config/supabase');
const AuthService = require('./AuthService');

class DispenserService {
  /**
   * Get all dispensers for a petrol pump
   */
  async getDispensers(pumpId, includeInactive = false) {
    try {
      let query = supabaseAdmin
        .from('dispensers')
        .select('*')
        .eq('petrol_pump_id', pumpId)
        .order('dispenser_code');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data: dispensers, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch dispensers: ${error.message}`);
      }

      return {
        success: true,
        data: dispensers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add new dispenser
   */
  async addDispenser(dispenserData, userId) {
    try {
      const {
        dispenserCode,
        fuelType,
        petrolPumpId,
        currentPrice,
        capacity,
        currentStock = 0
      } = dispenserData;

      // Check if dispenser code already exists for this pump
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('dispensers')
        .select('id')
        .eq('dispenser_code', dispenserCode)
        .eq('petrol_pump_id', petrolPumpId)
        .single();

      if (existing) {
        throw new Error('Dispenser code already exists for this petrol pump');
      }

      // Create new dispenser
      const { data: newDispenser, error: insertError } = await supabaseAdmin
        .from('dispensers')
        .insert({
          dispenser_code: dispenserCode,
          fuel_type: fuelType,
          petrol_pump_id: petrolPumpId,
          current_price: currentPrice,
          capacity: capacity,
          current_stock: currentStock,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to add dispenser: ${insertError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'CREATE', 'dispensers', newDispenser.id, null, newDispenser);

      return {
        success: true,
        data: newDispenser,
        message: 'Dispenser added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update dispenser details
   */
  async updateDispenser(dispenserId, updates, userId) {
    try {
      // Get current dispenser
      const { data: currentDispenser, error: fetchError } = await supabaseAdmin
        .from('dispensers')
        .select('*')
        .eq('id', dispenserId)
        .single();

      if (fetchError || !currentDispenser) {
        throw new Error('Dispenser not found');
      }

      // Update dispenser
      const { data: updatedDispenser, error: updateError } = await supabaseAdmin
        .from('dispensers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispenserId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update dispenser: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'dispensers', dispenserId, currentDispenser, updatedDispenser);

      return {
        success: true,
        data: updatedDispenser,
        message: 'Dispenser updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete/deactivate dispenser
   */
  async deleteDispenser(dispenserId, userId) {
    try {
      // Check if dispenser has active shifts
      const { data: activeShifts, error: shiftError } = await supabaseAdmin
        .from('shifts')
        .select('id')
        .eq('dispenser_id', dispenserId)
        .eq('status', 'ACTIVE');

      if (activeShifts && activeShifts.length > 0) {
        throw new Error('Cannot delete dispenser with active shifts');
      }

      // Get current dispenser
      const { data: currentDispenser, error: fetchError } = await supabaseAdmin
        .from('dispensers')
        .select('*')
        .eq('id', dispenserId)
        .single();

      if (fetchError || !currentDispenser) {
        throw new Error('Dispenser not found');
      }

      // Soft delete (deactivate)
      const { data: updatedDispenser, error: updateError } = await supabaseAdmin
        .from('dispensers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispenserId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to delete dispenser: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'DELETE', 'dispensers', dispenserId, currentDispenser, updatedDispenser);

      return {
        success: true,
        message: 'Dispenser deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set daily fuel rates
   */
  async setDailyRates(pumpId, rates, userId) {
    try {
      const effectiveDate = new Date().toISOString().split('T')[0]; // Today's date

      // Deactivate existing rates for today
      await supabaseAdmin
        .from('daily_rates')
        .update({ is_active: false })
        .eq('petrol_pump_id', pumpId)
        .eq('effective_date', effectiveDate);

      // Insert new rates
      const rateRecords = rates.map(rate => ({
        petrol_pump_id: pumpId,
        fuel_type: rate.fuelType,
        rate: rate.price,
        effective_date: effectiveDate,
        set_by: userId,
        notes: rate.notes || null,
        is_active: true
      }));

      const { data: newRates, error: insertError } = await supabaseAdmin
        .from('daily_rates')
        .insert(rateRecords)
        .select();

      if (insertError) {
        throw new Error(`Failed to set daily rates: ${insertError.message}`);
      }

      // Update current prices in dispensers
      for (const rate of rates) {
        await supabaseAdmin
          .from('dispensers')
          .update({ current_price: rate.price })
          .eq('petrol_pump_id', pumpId)
          .eq('fuel_type', rate.fuelType)
          .eq('is_active', true);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'CREATE', 'daily_rates', pumpId, null, newRates);

      return {
        success: true,
        data: newRates,
        message: 'Daily rates set successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get daily rates history
   */
  async getDailyRatesHistory(pumpId, startDate, endDate) {
    try {
      let query = supabaseAdmin
        .from('daily_rates')
        .select(`
          *,
          user_profiles:set_by (
            username
          )
        `)
        .eq('petrol_pump_id', pumpId)
        .order('effective_date', { ascending: false });

      if (startDate) {
        query = query.gte('effective_date', startDate);
      }

      if (endDate) {
        query = query.lte('effective_date', endDate);
      }

      const { data: rates, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch rates history: ${error.message}`);
      }

      return {
        success: true,
        data: rates
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current active rates
   */
  async getCurrentRates(pumpId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: rates, error } = await supabaseAdmin
        .from('daily_rates')
        .select('*')
        .eq('petrol_pump_id', pumpId)
        .eq('effective_date', today)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch current rates: ${error.message}`);
      }

      return {
        success: true,
        data: rates
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update stock levels
   */
  async updateStock(dispenserId, newStock, userId) {
    try {
      // Get current dispenser
      const { data: currentDispenser, error: fetchError } = await supabaseAdmin
        .from('dispensers')
        .select('*')
        .eq('id', dispenserId)
        .single();

      if (fetchError || !currentDispenser) {
        throw new Error('Dispenser not found');
      }

      // Update stock
      const { data: updatedDispenser, error: updateError } = await supabaseAdmin
        .from('dispensers')
        .update({
          current_stock: newStock,
          last_refill_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', dispenserId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update stock: ${updateError.message}`);
      }

      // Log audit event
      await AuthService.logAuditEvent(userId, 'UPDATE', 'dispensers', dispenserId, 
        { current_stock: currentDispenser.current_stock }, 
        { current_stock: newStock }
      );

      return {
        success: true,
        data: updatedDispenser,
        message: 'Stock updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dispenser statistics
   */
  async getDispenserStats(pumpId, startDate, endDate) {
    try {
      // Get dispensers with shift statistics
      const { data: dispensers, error: dispenserError } = await supabaseAdmin
        .from('dispensers')
        .select(`
          *,
          shifts!inner (
            fuel_sold,
            expected_cash,
            actual_cash,
            start_time,
            status
          )
        `)
        .eq('petrol_pump_id', pumpId)
        .eq('is_active', true);

      if (dispenserError) {
        throw new Error(`Failed to fetch dispenser stats: ${dispenserError.message}`);
      }

      // Calculate statistics for each dispenser
      const stats = dispensers.map(dispenser => {
        const shifts = dispenser.shifts.filter(shift => {
          const shiftDate = new Date(shift.start_time);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          return shiftDate >= start && shiftDate <= end && shift.status !== 'ACTIVE';
        });

        const totalFuelSold = shifts.reduce((sum, shift) => sum + (shift.fuel_sold || 0), 0);
        const totalRevenue = shifts.reduce((sum, shift) => sum + (shift.actual_cash || 0), 0);
        const totalShifts = shifts.length;

        return {
          dispenser_id: dispenser.id,
          dispenser_code: dispenser.dispenser_code,
          fuel_type: dispenser.fuel_type,
          current_price: dispenser.current_price,
          current_stock: dispenser.current_stock,
          capacity: dispenser.capacity,
          total_fuel_sold: totalFuelSold,
          total_revenue: totalRevenue,
          total_shifts: totalShifts,
          avg_fuel_per_shift: totalShifts > 0 ? totalFuelSold / totalShifts : 0,
          stock_percentage: (dispenser.current_stock / dispenser.capacity) * 100
        };
      });

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

module.exports = new DispenserService();