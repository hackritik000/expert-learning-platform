import { Router } from 'express';
import { educatorsController } from './educators.controller';
import { validateQuery } from '../../middleware/validate';
import { educatorFilterSchema } from '@expert/validation';

export const educatorsRouter = Router();

/**
 * @openapi
 * /api/educators:
 *   get:
 *     tags:
 *       - Educators
 *     summary: Search and filter educators
 *     description: Retrieve a paginated list of verified top educators with comprehensive search, subject category filter, pricing bounds, minimum rating, and online availability status.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching educator name, title, or biography
 *         example: "Computer Science"
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of academic subject to filter by
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum consultation rate in INR
 *         example: 200
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum consultation rate in INR
 *         example: 1000
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum average rating (e.g. 4.5)
 *         example: 4.5
 *       - in: query
 *         name: isOnline
 *         schema:
 *           type: boolean
 *         description: Filter only educators currently available online
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, price_asc, price_desc, experience]
 *           default: rating
 *         description: Sort order of results
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of educators per page
 *     responses:
 *       200:
 *         description: Paginated educators list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     educators:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Educator'
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 */
educatorsRouter.get('/', validateQuery(educatorFilterSchema), (req, res, next) =>
  educatorsController.getEducators(req, res, next),
);

/**
 * @openapi
 * /api/educators/{id}:
 *   get:
 *     tags:
 *       - Educators
 *     summary: Get educator profile by ID
 *     description: Retrieve detailed educator profile including subjects, reviews, and available consultation time slots.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Educator UUID
 *     responses:
 *       200:
 *         description: Educator profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Educator'
 *       404:
 *         description: Educator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
educatorsRouter.get('/:id', (req, res, next) =>
  educatorsController.getEducatorById(req, res, next),
);

/**
 * @openapi
 * /api/educators/{id}/slots:
 *   get:
 *     tags:
 *       - Educators
 *     summary: Get educator availability slots
 *     description: Retrieve upcoming booking time slots for a specific educator, optionally filtered by date.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Educator UUID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2026-11-06"
 *         description: Specific date formatted as YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Available consultation slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeSlot'
 *       404:
 *         description: Educator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
educatorsRouter.get('/:id/slots', (req, res, next) =>
  educatorsController.getEducatorSlots(req, res, next),
);

export const subjectsRouter = Router();

/**
 * @openapi
 * /api/subjects:
 *   get:
 *     tags:
 *       - Subjects
 *     summary: List all subjects and categories
 *     description: Retrieve list of all consultation categories and academic subjects along with the count of verified educators in each subject.
 *     security: []
 *     responses:
 *       200:
 *         description: List of academic subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subject'
 */
subjectsRouter.get('/', (req, res, next) => educatorsController.getSubjects(req, res, next));
