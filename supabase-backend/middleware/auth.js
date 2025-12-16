const { supabase } = require('../config/supabase');
const AuthService = require('../services/AuthService');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Get user profile
    const profileResult = await AuthService.getUserProfile(user.id);
    
    if (!profileResult.success || !profileResult.user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...profileResult.user
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const checkPumpAccess = async (req, res, next) => {
  try {
    const { pumpId } = req.params;
    const user = req.user;

    // Owners can access their own pumps
    if (user.role === 'OWNER') {
      if (user.petrolPumpId !== pumpId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied to this petrol pump' 
        });
      }
    }
    // Managers and operators can only access their assigned pump
    else if (['MANAGER', 'OPERATOR'].includes(user.role)) {
      if (user.petrolPumpId !== pumpId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied to this petrol pump' 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Pump access check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Access check failed' 
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkPumpAccess
};