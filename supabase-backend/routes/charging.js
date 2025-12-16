const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ChargingService = require('../services/ChargingService');
const { authenticateToken, authorizeRoles, checkPumpAccess } = require('../middleware/auth');

const router = express.Router();

// Get all charging points for a petrol pump
router.get('/pump/:pumpId/points', authenticateToken, checkPumpAccess, [
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

    const result = await ChargingService.getChargingPoints(pumpId, includeInactive);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get charging points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charging points'
    });
  }
});

// Add new charging point (Owner/Manager only)
router.post('/points', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), [
  body('chargingPointCode').notEmpty().isLength({ max: 20 }),
  body('petrolPumpId').isUUID(),
  body('chargingType').isIn(['AC_SLOW', 'AC_FAST', 'DC_FAST', 'DC_ULTRA']),
  body('powerRating').isFloat({ min: 0 }),
  body('currentRate').isFloat({ min: 0 }),
  body('connectorTypes').optional().isArray()
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

    const result = await ChargingService.addChargingPoint(req.body, req.user.id);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Add charging point error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add charging point'
    });
  }
});

// Update charging point (Owner/Manager only)
router.put('/points/:id', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), [
  body('chargingPointCode').optional().isLength({ max: 20 }),
  body('chargingType').optional().isIn(['AC_SLOW', 'AC_FAST', 'DC_FAST', 'DC_ULTRA']),
  body('powerRating').optional().isFloat({ min: 0 }),
  body('currentRate').optional().isFloat({ min: 0 }),
  body('connectorTypes').optional().isArray(),
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
    const result = await ChargingService.updateChargingPoint(id, req.body, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Update charging point error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update charging point'
    });
  }
});

// Delete charging point (Owner/Manager only)
router.delete('/points/:id', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ChargingService.deleteChargingPoint(id, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Delete charging point error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete charging point'
    });
  }
});

// Update charging point status
router.put('/points/:id/status', authenticateToken, authorizeRoles('OWNER', 'MANAGER', 'OPERATOR'), [
  body('status').isIn(['AVAILABLE', 'OCCUPIED', 'OUT_OF_ORDER', 'MAINTENANCE'])
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
    const { status } = req.body;

    const result = await ChargingService.updateChargingPointStatus(id, status, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Update charging point status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update charging point status'
    });
  }
});

// Start charging session
router.post('/sessions', authenticateToken, [
  body('chargingPointId').isUUID(),
  body('customerInfo').optional().isObject(),
  body('ratePerKwh').optional().isFloat({ min: 0 })
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

    const result = await ChargingService.startChargingSession(req.body, req.user.id);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Start charging session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start charging session'
    });
  }
});

// End charging session
router.put('/sessions/:id/end', authenticateToken, [
  body('energyDispensed').isFloat({ min: 0 }),
  body('paymentMethod').isIn(['CASH', 'UPI', 'CARD', 'WALLET']),
  body('paymentStatus').optional().isIn(['PENDING', 'COMPLETED', 'FAILED'])
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
    const result = await ChargingService.endChargingSession(id, req.body, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('End charging session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end charging session'
    });
  }
});

// Get charging sessions for a petrol pump
router.get('/pump/:pumpId/sessions', authenticateToken, checkPumpAccess, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'INTERRUPTED']),
  query('operatorId').optional().isUUID(),
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
    const filters = req.query;

    const result = await ChargingService.getChargingSessions(pumpId, filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get charging sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charging sessions'
    });
  }
});

// Get charging statistics
router.get('/pump/:pumpId/stats', authenticateToken, checkPumpAccess, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('operatorId').optional().isUUID()
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
    const filters = req.query;

    const result = await ChargingService.getChargingStats(pumpId, filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get charging stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charging statistics'
    });
  }
});

module.exports = router;