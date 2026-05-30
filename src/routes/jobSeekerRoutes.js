const router = require('express').Router();
const {
  updateProfile, getProfile, uploadResume,
  searchJobs, getJobDetails,
  applyForJob, getMyApplications, getApplicationById, withdrawApplication,
} = require('../controllers/jobSeekerController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema, applyJobSchema } = require('../validators/schemas');
const { uploadResume: uploadResumeMiddleware, uploadImage } = require('../config/cloudinary');

/**
 * @swagger
 * tags:
 *   name: JobSeeker
 *   description: Job seeker endpoints
 */

// Public job search (no auth required)
/**
 * @swagger
 * /api/jobseeker/jobs:
 *   get:
 *     summary: Search and filter jobs
 *     tags: [JobSeeker]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *           description: Comma-separated skills
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Jobs fetched
 */
router.get('/jobs', searchJobs);
router.get('/jobs/:id', getJobDetails);

// Protected routes
router.use(protect, authorize('jobseeker'));

// Profile
/**
 * @swagger
 * /api/jobseeker/profile:
 *   get:
 *     summary: Get job seeker profile
 *     tags: [JobSeeker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/jobseeker/profile:
 *   put:
 *     summary: Update job seeker profile
 *     tags: [JobSeeker]
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
 *               headline:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', uploadImage.single('avatar'), validate(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /api/jobseeker/resume:
 *   post:
 *     summary: Upload resume
 *     tags: [JobSeeker]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [resume]
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 */
router.post('/resume', uploadResumeMiddleware.single('resume'), uploadResume);

// Applications
/**
 * @swagger
 * /api/jobseeker/jobs/{jobId}/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [JobSeeker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted
 *       409:
 *         description: Already applied
 */
router.post('/jobs/:jobId/apply', uploadResumeMiddleware.single('resume'), validate(applyJobSchema), applyForJob);

/**
 * @swagger
 * /api/jobseeker/applications:
 *   get:
 *     summary: Get all my applications
 *     tags: [JobSeeker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, shortlisted, rejected, hired]
 *     responses:
 *       200:
 *         description: Applications fetched
 */
router.get('/applications', getMyApplications);
router.get('/applications/:id', getApplicationById);
router.delete('/applications/:id', withdrawApplication);

module.exports = router;
