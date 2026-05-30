const router = require('express').Router();
const {
  updateCompanyProfile, getCompanyProfile,
  createJob, updateJob, deleteJob, getMyJobs, getJobById,
  getApplicants, updateApplicationStatus,
} = require('../controllers/employerController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { jobSchema, updateJobSchema, updateCompanySchema, updateStatusSchema } = require('../validators/schemas');
const { uploadImage } = require('../config/cloudinary');

router.use(protect, authorize('employer'));

/**
 * @swagger
 * tags:
 *   name: Employer
 *   description: Employer management endpoints
 */

// Company Profile
/**
 * @swagger
 * /api/employer/company:
 *   get:
 *     summary: Get company profile
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile fetched
 */
router.get('/company', getCompanyProfile);

/**
 * @swagger
 * /api/employer/company:
 *   put:
 *     summary: Update company profile
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               website:
 *                 type: string
 *               industry:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company profile updated
 */
router.put('/company', uploadImage.single('logo'), validate(updateCompanySchema), updateCompanyProfile);

// Jobs
/**
 * @swagger
 * /api/employer/jobs:
 *   get:
 *     summary: Get all jobs posted by employer
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, draft]
 *     responses:
 *       200:
 *         description: Jobs fetched
 */
router.get('/jobs', getMyJobs);

/**
 * @swagger
 * /api/employer/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, skillsRequired, employmentType, experienceLevel, deadline]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               employmentType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, internship, freelance, remote]
 *               experienceLevel:
 *                 type: string
 *                 enum: [entry, junior, mid, senior, lead, executive]
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Job created
 */
router.post('/jobs', validate(jobSchema), createJob);

router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', validate(updateJobSchema), updateJob);
router.delete('/jobs/:id', deleteJob);

// Applicants
/**
 * @swagger
 * /api/employer/jobs/{jobId}/applicants:
 *   get:
 *     summary: Get applicants for a job
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, shortlisted, rejected, hired]
 *     responses:
 *       200:
 *         description: Applicants fetched
 */
router.get('/jobs/:jobId/applicants', getApplicants);

/**
 * @swagger
 * /api/employer/applications/{applicationId}/status:
 *   patch:
 *     summary: Update application status
 *     tags: [Employer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [shortlisted, rejected, hired]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/applications/:applicationId/status', validate(updateStatusSchema), updateApplicationStatus);

module.exports = router;
