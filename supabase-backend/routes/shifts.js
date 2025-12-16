const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ShiftService = require('../services/ShiftService');
const { authenticateToken, authorizeRoles, checkPumpAccess } = require('../middleware/auth');

const router = express.Router();

// Get all shifts for a petrol pump
router.get('/pump/:pumpId', authenticateToken, checkPumpAccess, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'FLAGGED']),
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

    const result = await ShiftService.getShifts(pumpId, filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts'
    });
  }
});

// Get shift by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await ShiftService.getShiftById(req.params.id);

    if (result.success) {
      // Check if user has access to this shift's pump
      const userPumpId = req.user.petrolPumpId;
      const shiftPumpId = result.data.dispensers.petrol_pumps.id;
      
      if (userPumpId !== shiftPumpId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this shift'
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift'
    });
  }
});

// Start new shift
router.post('/', authenticateToken, [
  body('dispenserId').isUUID(),
  body('shiftType').isIn(['MORNING', 'EVENING', 'NIGHT']),
  body('openingReading').isFloat({ min: 0 }),
  body('notes').optional().isLength({ max: 1000 })
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

    const result = await ShiftService.startShift(req.body, req.user.id);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start shift'
    });
  }
});

// End shift
router.put('/:id/end', authenticateToken, [
  body('closingReading').isFloat({ min: 0 }),
  body('actualCash').optional().isFloat({ min: 0 }),
  body('digitalPayments.upi').optional().isFloat({ min: 0 }),
  body('digitalPayments.card').optional().isFloat({ min: 0 }),
  body('digitalPayments.other').optional().isFloat({ min: 0 }),
  body('cashUsed').optional().isFloat({ min: 0 }),
  body('cashUsageReason').optional().isLength({ max: 500 }),
  body('notes').optional().isLength({ max: 1000 })
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
    const result = await ShiftService.endShift(id, req.body, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end shift'
    });
  }
});

// Resolve shift discrepancy (Owner/Manager only)
router.put('/:id/resolve', authenticateToken, authorizeRoles('OWNER', 'MANAGER'), [
  body('reason').notEmpty().isLength({ max: 500 })
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
    const { reason } = req.body;
    const result = await ShiftService.resolveDiscrepancy(id, reason, req.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Resolve shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve shift discrepancy'
    });
  }
});

// Get shift statistics
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

    const result = await ShiftService.getShiftStats(pumpId, filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Get shift stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift statistics'
    });
  }
});

module.exports = router;