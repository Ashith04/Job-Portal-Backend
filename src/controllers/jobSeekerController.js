const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { paginate, paginateMeta } = require('../utils/paginate');
const { uploadToCloudinary } = require('../config/cloudinary');

// Profile Management
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'headline', 'bio', 'phone', 'location', 'skills', 'education', 'experience'];
    const updates = {};
    allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, { folder: 'job-portal/profiles', resource_type: 'image' });
      updates.avatar = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    return successResponse(res, 200, 'Profile updated', { user });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, 200, 'Profile fetched', { user });
  } catch (error) {
    next(error);
  }
};

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'Resume file is required');

    const result = await uploadToCloudinary(req.file.buffer, { folder: 'job-portal/resumes', resource_type: 'raw' });
    const resumeData = {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      uploadedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { resume: resumeData } },
      { new: true }
    );

    return successResponse(res, 200, 'Resume uploaded successfully', { resume: user.resume });
  } catch (error) {
    next(error);
  }
};

// Job Search & Filter
const searchJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { keyword, location, employmentType, experienceLevel, minSalary, maxSalary, skills } = req.query;

    const filter = { status: 'active', isDeleted: false, deadline: { $gte: new Date() } };

    if (keyword) filter.$text = { $search: keyword };
    if (location) filter['location.city'] = new RegExp(location, 'i');
    if (employmentType) filter.employmentType = employmentType;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (skills) filter.skillsRequired = { $in: skills.split(',').map(s => new RegExp(s.trim(), 'i')) };
    if (minSalary) filter['salary.min'] = { $gte: Number(minSalary) };
    if (maxSalary) filter['salary.max'] = { $lte: Number(maxSalary) };

    const sortOption = keyword ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

    const [jobs, total] = await Promise.all([
      Job.find(filter, keyword ? { score: { $meta: 'textScore' } } : {})
        .populate('employer', 'name company.name company.logo company.location')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Jobs fetched', { jobs }, paginateMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getJobDetails = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'active', isDeleted: false })
      .populate('employer', 'name company');
    if (!job) return errorResponse(res, 404, 'Job not found');
    return successResponse(res, 200, 'Job details fetched', { job });
  } catch (error) {
    next(error);
  }
};

// Applications
const applyForJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, status: 'active', isDeleted: false });
    if (!job) return errorResponse(res, 404, 'Job not found or no longer active');
    if (job.deadline < new Date()) return errorResponse(res, 400, 'Application deadline has passed');

    const existing = await Application.findOne({ job: req.params.jobId, applicant: req.user._id });
    if (existing) return errorResponse(res, 409, 'You have already applied for this job');

    const user = await User.findById(req.user._id);
    let resumeData;
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, { folder: 'job-portal/resumes', resource_type: 'raw' });
      resumeData = { url: result.secure_url, publicId: result.public_id, originalName: req.file.originalname };
    } else if (user.resume && user.resume.url) {
      resumeData = { url: user.resume.url, publicId: user.resume.publicId, originalName: user.resume.originalName };
    } else {
      // Fallback for easy local testing without Cloudinary
      resumeData = { url: "http://example.com/dummy-resume.pdf", publicId: "mock123", originalName: "dummy-resume.pdf" };
    }

    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user._id,
      employer: job.employer,
      coverLetter: req.body.coverLetter,
      resume: resumeData,
      statusHistory: [{ status: 'applied', changedAt: new Date() }],
    });

    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicantsCount: 1 } });

    return successResponse(res, 201, 'Application submitted successfully', { application });
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { applicant: req.user._id, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('job', 'title employmentType location salary deadline status')
        .populate('employer', 'name company.name company.logo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Applications fetched', { applications }, paginateMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user._id })
      .populate('job')
      .populate('employer', 'name company');
    if (!application) return errorResponse(res, 404, 'Application not found');
    return successResponse(res, 200, 'Application fetched', { application });
  } catch (error) {
    next(error);
  }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicant: req.user._id,
      status: 'applied',
    });
    if (!application) return errorResponse(res, 404, 'Application not found or cannot be withdrawn');

    application.isDeleted = true;
    await application.save();
    await Job.findByIdAndUpdate(application.job, { $inc: { applicantsCount: -1 } });

    return successResponse(res, 200, 'Application withdrawn');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  getProfile,
  uploadResume,
  searchJobs,
  getJobDetails,
  applyForJob,
  getMyApplications,
  getApplicationById,
  withdrawApplication,
};
