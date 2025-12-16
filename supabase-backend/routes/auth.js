const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('mobileNumber').matches(/^[0-9]{10}$/),
  body('role').isIn(['OWNER', 'MANAGER', 'OPERATOR']),
  body('petrolPumpId').isUUID()
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

    const result = await AuthService.register(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
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

    const { username, password, deviceInfo } = req.body;
    const result = await AuthService.login({ username, password }, deviceInfo);

    if (result.success) {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.session.access_token,
          refreshToken: result.session.refresh_token,
          expiresIn: result.session.expires_in
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { deviceInfo } = req.body;
    const result = await AuthService.logout(req.user.id, deviceInfo);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await AuthService.getUserProfile(req.user.id);

    if (result.success) {
      res.json({
        success: true,
        data: result.user
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('username').optional().isLength({ min: 3, max: 50 }).trim(),
  body('mobileNumber').optional().matches(/^[0-9]{10}$/)
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

    const { username, mobileNumber, deviceInfo } = req.body;
    const updates = {};
    
    if (username) updates.username = username;
    if (mobileNumber) updates.mobile_number = mobileNumber;
    if (deviceInfo) updates.device_info = deviceInfo;

    const result = await AuthService.updateProfile(req.user.id, updates);

    if (result.success) {
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('newPassword').isLength({ min: 6 })
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

    const { newPassword } = req.body;
    const result = await AuthService.changePassword(req.user.id, newPassword);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
});

module.exports = router;