const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const crypto = require('crypto');

const generateTokens = (userId) => {
  const jti = crypto.randomBytes(16).toString('hex');
  const accessToken = jwt.sign({ id: userId, jti }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  const refreshToken = jwt.sign({ id: userId, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });
  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 409, 'Email already registered');

    const user = await User.create({ name, email, password, role });
    const { accessToken, refreshToken } = generateTokens(user._id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    return successResponse(res, 201, 'Registration successful', {
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, 'Invalid email or password');
    }
    if (user.isBlocked) return errorResponse(res, 403, 'Your account has been blocked');

    const { accessToken, refreshToken } = generateTokens(user._id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    user.lastLogin = new Date();
    await User.findByIdAndUpdate(user._id, { lastLogin: user.lastLogin });

    const userObj = user.toObject();
    delete userObj.password;

    return successResponse(res, 200, 'Login successful', { user: userObj, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 400, 'Refresh token required');

    const stored = await RefreshToken.findOne({ token, isRevoked: false });
    if (!stored || stored.expiresAt < new Date()) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.isBlocked || user.isDeleted) {
      return errorResponse(res, 401, 'User not authorized');
    }

    // Rotate refresh token
    stored.isRevoked = true;
    await stored.save();

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.findOneAndUpdate(
      { user: user._id, token: newRefreshToken },
      { user: user._id, token: newRefreshToken, expiresAt, isRevoked: false, userAgent: req.headers['user-agent'], ip: req.ip },
      { upsert: true, new: true }
    );

    return successResponse(res, 200, 'Token refreshed', { accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return errorResponse(res, 401, 'Invalid refresh token');
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
    }
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return successResponse(res, 200, 'Profile fetched', { user: req.user });
};

module.exports = { register, login, refreshToken, logout, getMe };
