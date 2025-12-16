const express = require('express');
const { body, query, validationResult } = require('express-validator');
const DispenserService = require('../services/DispenserService');
const { authenticateToken, authorizeRoles, checkPumpAccess } = require('../middleware/auth');

const router = express.Router();

// Get all dispensers for a petrol pump
router.get('/pump/:pumpId', authenticateToken, checkPumpAccess, [
  query('includeInactive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pumpId } = req.params;
    const { includeInactive = false } = req.query;

    const result = await DispenserService.getDispensers(pumpId, includeInactive);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get dispensers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispensers'
    });
  }
});

// Add new dispenser (Owner/Manager only)
router.post('/', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), [
  body('dispenserCode').notEmpty().isLength({ max: 20 }),
  body('fuelType').isIn(['PETROL', 'DIESEL', 'CNG']),
  body('petrolPumpId').isUUID(),
  body('currentPrice').isFloat({ min: 0 }),
  body('capacity').isFloat({ min: 0 }),
  body('currentStock').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user has access to this pump
    if (req.user.petrolPumpId !== req.body.petrolPumpId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this petrol pump'
      });
    }

    const result = await DispenserService.addDispenser(req.body, req.user.id);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Add dispenser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add dispenser'
    });
  }
});

// Update dispenser (Owner/Manager only)
router.put('/:id', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), [
  body('dispenserCode').optional().isLength({ max: 20 }),
  body('currentPrice').optional().isFloat({ min: 0 }),
  body('capacity').optional().isFloat({ min: 0 }),
  body('currentStock').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const result = await DispenserService.updateDispenser(id, req.body, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Update dispenser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispenser'
    });
  }
});

// Delete dispenser (Owner/Manager only)
router.delete('/:id', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DispenserService.deleteDispenser(id, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Delete dispenser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dispenser'
    });
  }
});

// Set daily fuel rates (Owner/Manager only)
router.post('/pump/:pumpId/rates', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), checkPumpAccess, [
  body('rates').isArray({ min: 1 }),
  body('rates.*.fuelType').isIn(['PETROL', 'DIESEL', 'CNG']),
  body('rates.*.price').isFloat({ min: 0 }),
  body('rates.*.notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pumpId } = req.params;
    const { rates } = req.body;

    const result = await DispenserService.setDailyRates(pumpId, rates, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Set daily rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set daily rates'
    });
  }
});

// Get daily rates history
router.get('/pump/:pumpId/rates', authenticateToken, checkPumpAccess, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pumpId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await DispenserService.getDailyRatesHistory(pumpId, startDate, endDate);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get rates history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rates history'
    });
  }
});

// Get current active rates
router.get('/pump/:pumpId/rates/current', authenticateToken, checkPumpAccess, async (req, res) => {
  try {
    const { pumpId } = req.params;
    const result = await DispenserService.getCurrentRates(pumpId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get current rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current rates'
    });
  }
});

// Update stock levels (Owner/Manager only)
router.put('/:id/stock', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), [
  body('newStock').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { newStock } = req.body;

    const result = await DispenserService.updateStock(id, newStock, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
});

// Get dispenser statistics
router.get('/pump/:pumpId/stats', authenticateToken, checkPumpAccess, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { pumpId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await DispenserService.getDispenserStats(pumpId, startDate, endDate);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get dispenser stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispenser statistics'
    });
  }
});

module.exports = router;