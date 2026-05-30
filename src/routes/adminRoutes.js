const router = require('express').Router();
const {
  getAllUsers, getUserById, blockUnblockUser, deleteUser,
  getAllJobs, removeJob, flagJob,
  getPlatformAnalytics,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

router.use(protect, authorize('admin'));

// Analytics
/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics fetched
 */
router.get('/analytics', getPlatformAnalytics);

// User Management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, employer, jobseeker]
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users fetched
 */
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   patch:
 *     summary: Block or unblock a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked/unblocked
 */
router.patch('/users/:id/block', blockUnblockUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Soft delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', deleteUser);

// Job Management
/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     summary: Get all jobs (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isFlagged
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jobs fetched
 */
router.get('/jobs', getAllJobs);

/**
 * @swagger
 * /api/admin/jobs/{id}:
 *   delete:
 *     summary: Remove a fake/spam job
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job removed
 */
router.delete('/jobs/:id', removeJob);

/**
 * @swagger
 * /api/admin/jobs/{id}/flag:
 *   patch:
 *     summary: Flag or unflag a suspicious job
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job flagged/unflagged
 */
router.patch('/jobs/:id/flag', flagJob);

module.exports = router;
