const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
  role: Joi.string().valid('employer', 'jobseeker').default('jobseeker'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const jobSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(20).required(),
  skillsRequired: Joi.array().items(Joi.string()).min(1).required(),
  tags: Joi.array().items(Joi.string()),
  salary: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
    currency: Joi.string().default('INR'),
    isNegotiable: Joi.boolean(),
    period: Joi.string().valid('hourly', 'monthly', 'yearly'),
  }),
  employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'freelance', 'remote').required(),
  experienceLevel: Joi.string().valid('entry', 'junior', 'mid', 'senior', 'lead', 'executive').required(),
  location: Joi.object({
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    isRemote: Joi.boolean(),
  }),
  deadline: Joi.date().greater('now').required(),
  openings: Joi.number().min(1).default(1),
  status: Joi.string().valid('active', 'closed', 'draft'),
});

const updateJobSchema = jobSchema.fork(
  ['title', 'description', 'skillsRequired', 'employmentType', 'experienceLevel', 'deadline'],
  (field) => field.optional()
);

const applyJobSchema = Joi.object({
  coverLetter: Joi.string().max(2000),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  headline: Joi.string().max(100),
  bio: Joi.string().max(500),
  phone: Joi.string().max(15),
  location: Joi.string().max(100),
  skills: Joi.array().items(Joi.string()),
  education: Joi.array().items(Joi.object({
    institution: Joi.string().required(),
    degree: Joi.string().required(),
    fieldOfStudy: Joi.string(),
    startYear: Joi.number(),
    endYear: Joi.number(),
    grade: Joi.string(),
  })),
  experience: Joi.array().items(Joi.object({
    company: Joi.string().required(),
    title: Joi.string().required(),
    location: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    current: Joi.boolean(),
    description: Joi.string(),
  })),
});

const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  website: Joi.string().uri(),
  industry: Joi.string(),
  size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+'),
  description: Joi.string().max(1000),
  location: Joi.string(),
  founded: Joi.number().min(1800).max(new Date().getFullYear()),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('shortlisted', 'rejected', 'hired').required(),
  note: Joi.string().max(500),
});

module.exports = {
  registerSchema,
  loginSchema,
  jobSchema,
  updateJobSchema,
  applyJobSchema,
  updateProfileSchema,
  updateCompanySchema,
  updateStatusSchema,
};
