import {
  batchCreateSlotsSchema,
  createSlotSchema,
  educatorFilterSchema,
  updateSlotSchema,
} from '@repo/validation';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import { educatorsController } from './educators.controller';

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
educatorsRouter.get('/', validateQuery(educatorFilterSchema), educatorsController.getEducators);

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
/**
 * @openapi
 * /api/educators/me:
 *   get:
 *     tags:
 *       - Educators
 *     summary: Get educator profile of current user
 *     description: Retrieve detailed educator profile (subjects, ratings, rate, slots) for the logged-in educator user.
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Educator profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
educatorsRouter.get('/me', requireAuth, educatorsController.getMyEducatorProfile);

// Educator Slot Management (must be declared before /:id)

/**
 * @openapi
 * /api/educators/slots/manage:
 *   get:
 *     tags:
 *       - Educators
 *     summary: Get educator's own availability slots
 *     description: Retrieve all availability slots configured by the authenticated educator.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of educator availability slots
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
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Educators
 *     summary: Create a new availability slot
 *     description: Create an open consultation time slot for the authenticated educator.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               date:
 *                 type: string
 *                 example: "2026-11-15"
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "11:00"
 *     responses:
 *       201:
 *         description: Slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slot created successfully
 *                 data:
 *                   $ref: '#/components/schemas/TimeSlot'
 *       400:
 *         description: Validation failed or slot overlaps
 *       401:
 *         description: Unauthorized
 */
educatorsRouter.get('/slots/manage', requireAuth, educatorsController.getMySlots);
educatorsRouter.post(
  '/slots/manage',
  requireAuth,
  validateBody(createSlotSchema),
  educatorsController.createSlot,
);

/**
 * @openapi
 * /api/educators/slots/manage/batch:
 *   post:
 *     tags:
 *       - Educators
 *     summary: Batch create availability slots
 *     description: Create multiple consultation time slots in bulk for the authenticated educator.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slots
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - date
 *                     - startTime
 *                     - endTime
 *                   properties:
 *                     date:
 *                       type: string
 *                       example: "2026-11-15"
 *                     startTime:
 *                       type: string
 *                       example: "14:00"
 *                     endTime:
 *                       type: string
 *                       example: "15:00"
 *     responses:
 *       201:
 *         description: Slots created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slots created successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeSlot'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
educatorsRouter.post(
  '/slots/manage/batch',
  requireAuth,
  validateBody(batchCreateSlotsSchema),
  educatorsController.batchCreateSlots,
);

/**
 * @openapi
 * /api/educators/slots/manage/{slotId}:
 *   put:
 *     tags:
 *       - Educators
 *     summary: Update an availability slot
 *     description: Update date or timing of an unbooked availability slot owned by the authenticated educator.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Availability slot UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 example: "2026-11-15"
 *               startTime:
 *                 type: string
 *                 example: "16:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *     responses:
 *       200:
 *         description: Slot updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slot updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/TimeSlot'
 *       400:
 *         description: Slot already booked or invalid timings
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Slot not found
 *   delete:
 *     tags:
 *       - Educators
 *     summary: Delete an availability slot
 *     description: Remove an unbooked availability slot owned by the authenticated educator.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Availability slot UUID
 *     responses:
 *       200:
 *         description: Slot deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Time slot deleted successfully
 *       400:
 *         description: Cannot delete booked slot
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Slot not found
 */
educatorsRouter.put(
  '/slots/manage/:slotId',
  requireAuth,
  validateBody(updateSlotSchema),
  educatorsController.updateSlot,
);
educatorsRouter.delete('/slots/manage/:slotId', requireAuth, educatorsController.deleteSlot);

educatorsRouter.get('/:id', educatorsController.getEducatorById);

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
educatorsRouter.get('/:id/slots', educatorsController.getEducatorSlots);

/**
 * @openapi
 * /api/educators/update/{id}:
 *   post:
 *     tags:
 *       - Educators
 *     summary: Update educator profile by ID (post)
 *     description: Update profile details for an educator (title, bio, rate, subjects, online status).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Educator UUID or me
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *               ratePerSession:
 *                 type: number
 *               experienceYears:
 *                 type: number
 *               education:
 *                 type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               isOnline:
 *                 type: boolean
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Educator profile updated successfully
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - Educators
 *     summary: Update educator profile by ID (put)
 *     description: Update profile details for an educator (title, bio, rate, subjects, online status).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Educator UUID or me
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *               ratePerSession:
 *                 type: number
 *               experienceYears:
 *                 type: number
 *               education:
 *                 type: string
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               isOnline:
 *                 type: boolean
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Educator profile updated successfully
 *       401:
 *         description: Unauthorized
 */
educatorsRouter.post('/update/:id', requireAuth, educatorsController.updateEducatorProfile);
educatorsRouter.put('/update/:id', requireAuth, educatorsController.updateEducatorProfile);

/**
 * @openapi
 * /api/educators/{id}:
 *   post:
 *     tags:
 *       - Educators
 *     summary: Update educator profile (post)
 *     description: Update profile details for an educator.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Educator UUID
 *     responses:
 *       200:
 *         description: Educator profile updated successfully
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - Educators
 *     summary: Update educator profile (put)
 *     description: Update profile details for an educator.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Educator UUID
 *     responses:
 *       200:
 *         description: Educator profile updated successfully
 *       401:
 *         description: Unauthorized
 */
educatorsRouter.post('/:id', requireAuth, educatorsController.updateEducatorProfile);
educatorsRouter.put('/:id', requireAuth, educatorsController.updateEducatorProfile);

/**
 * @openapi
 * /api/educators/me:
 *   put:
 *     tags:
 *       - Educators
 *     summary: Update own educator profile
 *     description: Update authenticated educator's profile details.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Educator profile updated successfully
 *       401:
 *         description: Unauthorized
 */
educatorsRouter.put('/me', requireAuth, educatorsController.updateEducatorProfile);

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
subjectsRouter.get('/', educatorsController.getSubjects);
