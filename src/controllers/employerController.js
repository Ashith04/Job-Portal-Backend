const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { paginate, paginateMeta } = require('../utils/paginate');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');

// Company Profile
const updateCompanyProfile = async (req, res, next) => {
  try {
    const updates = {};
    Object.keys(req.body).forEach(key => { updates[`company.${key}`] = req.body[key]; });

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, { folder: 'job-portal/logos', resource_type: 'image' });
      updates['company.logo'] = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    return successResponse(res, 200, 'Company profile updated', { user });
  } catch (error) {
    next(error);
  }
};

const getCompanyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('company name email');
    return successResponse(res, 200, 'Company profile fetched', { user });
  } catch (error) {
    next(error);
  }
};

// Job Management
const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, employer: req.user._id });
    return successResponse(res, 201, 'Job created successfully', { job });
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id, isDeleted: false });
    if (!job) return errorResponse(res, 404, 'Job not found');

    Object.assign(job, req.body);
    await job.save();
    return successResponse(res, 200, 'Job updated', { job });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id, isDeleted: false });
    if (!job) return errorResponse(res, 404, 'Job not found');

    job.isDeleted = true;
    job.status = 'closed';
    await job.save();
    return successResponse(res, 200, 'Job deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getMyJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { employer: req.user._id, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Jobs fetched', { jobs }, paginateMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user._id, isDeleted: false });
    if (!job) return errorResponse(res, 404, 'Job not found');
    return successResponse(res, 200, 'Job fetched', { job });
  } catch (error) {
    next(error);
  }
};

// Applicant Management
const getApplicants = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, employer: req.user._id, isDeleted: false });
    if (!job) return errorResponse(res, 404, 'Job not found');

    const { page, limit, skip } = paginate(req.query);
    const filter = { job: req.params.jobId, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('applicant', 'name email headline skills resume avatar location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Applicants fetched', { applications }, paginateMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const application = await Application.findOne({
      _id: req.params.applicationId,
      employer: req.user._id,
      isDeleted: false,
    });
    if (!application) return errorResponse(res, 404, 'Application not found');

    application.status = status;
    application.statusHistory.push({ status, note, changedAt: new Date() });
    await application.save();

    return successResponse(res, 200, `Candidate ${status}`, { application });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateCompanyProfile,
  getCompanyProfile,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  getJobById,
  getApplicants,
  updateApplicationStatus,
};
