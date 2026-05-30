const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return errorResponse(res, 401, 'User not found');
    if (user.isBlocked) return errorResponse(res, 403, 'Your account has been blocked');
    if (user.isDeleted) return errorResponse(res, 401, 'Account no longer exists');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return errorResponse(res, 401, 'Access token expired');
    if (error.name === 'JsonWebTokenError') return errorResponse(res, 401, 'Invalid access token');
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return errorResponse(res, 403, `Role '${req.user.role}' is not authorized for this action`);
  }
  next();
};

module.exports = { protect, authorize };
