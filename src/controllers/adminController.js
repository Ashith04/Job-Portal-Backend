const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { paginate, paginateMeta } = require('../utils/paginate');

// User Management
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { isDeleted: false };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';
    if (req.query.search) filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Users fetched', { users }, paginateMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select('-password');
    if (!user) return errorResponse(res, 404, 'User not found');
    return successResponse(res, 200, 'User fetched', { user });
  } catch (error) {
    next(error);
  }
};

const blockUnblockUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return errorResponse(res, 404, 'User not found');
    if (user.role === 'admin') return errorResponse(res, 403, 'Cannot block an admin');

    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, {
      userId: user._id,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return errorResponse(res, 404, 'User not found');
    if (user.role === 'admin') return errorResponse(res, 403, 'Cannot delete an admin');

    user.isDeleted = true;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Job Management
const getAllJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isFlagged !== undefined) filter.isFlagged = req.query.isFlagged === 'true';
    if (req.query.isDeleted !== undefined) filter.isDeleted = req.query.isDeleted === 'true';
    else filter.isDeleted = false;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('employer', 'name email company.name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Jobs fetched', { jobs }, paginateMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const removeJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return errorResponse(res, 404, 'Job not found');

    job.isDeleted = true;
    job.status = 'closed';
    await job.save();

    return successResponse(res, 200, 'Job removed successfully');
  } catch (error) {
    next(error);
  }
};

const flagJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return errorResponse(res, 404, 'Job not found');

    job.isFlagged = !job.isFlagged;
    await job.save();

    return successResponse(res, 200, `Job ${job.isFlagged ? 'flagged' : 'unflagged'} successfully`, {
      jobId: job._id,
      isFlagged: job.isFlagged,
    });
  } catch (error) {
    next(error);
  }
};

// Analytics
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalEmployers,
      totalJobSeekers,
      blockedUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      applicationsByStatus,
      topEmployers,
      recentSignups,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: 'employer', isDeleted: false }),
      User.countDocuments({ role: 'jobseeker', isDeleted: false }),
      User.countDocuments({ isBlocked: true, isDeleted: false }),
      Job.countDocuments({ isDeleted: false }),
      Job.countDocuments({ status: 'active', isDeleted: false }),
      Application.countDocuments({ isDeleted: false }),
      Application.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$employer', jobCount: { $sum: 1 }, totalApplicants: { $sum: '$applicantsCount' } } },
        { $sort: { jobCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employer' } },
        { $unwind: '$employer' },
        { $project: { 'employer.name': 1, 'employer.company.name': 1, jobCount: 1, totalApplicants: 1 } },
      ]),
      User.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    ]);

    const analytics = {
      users: { total: totalUsers, employers: totalEmployers, jobSeekers: totalJobSeekers, blocked: blockedUsers },
      jobs: { total: totalJobs, active: activeJobs },
      applications: {
        total: totalApplications,
        byStatus: applicationsByStatus.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
      },
      topEmployers,
      recentSignups,
    };

    return successResponse(res, 200, 'Analytics fetched', { analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  blockUnblockUser,
  deleteUser,
  getAllJobs,
  removeJob,
  flagJob,
  getPlatformAnalytics,
};
