import { Router } from 'express';
import { bookingsController } from './bookings.controller';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createBookingSchema, cancelBookingSchema } from '@expert/validation';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Book a consultation session
 *     description: Book an available time slot with an educator. Automatically validates that the slot is open, verifies that student wallet has sufficient balance, and deducts the fee.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - educatorId
 *               - slotId
 *             properties:
 *               educatorId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174003"
 *               slotId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174002"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Need guidance with dynamic programming and tree algorithms"
 *     responses:
 *       201:
 *         description: Booking confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Slot already booked or insufficient wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags:
 *       - Bookings
 *     summary: List user consultation bookings
 *     description: Fetch all consultation bookings (upcoming and past) for the authenticated student or educator.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of consultation bookings
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
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
bookingsRouter.post('/', validateBody(createBookingSchema), (req, res, next) =>
  bookingsController.createBooking(req, res, next),
);

bookingsRouter.get('/', (req, res, next) => bookingsController.getUserBookings(req, res, next));

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Get booking details by ID
 *     description: Retrieve detailed information for a specific booking owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking UUID
 *     responses:
 *       200:
 *         description: Booking details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
bookingsRouter.get('/:id', (req, res, next) => bookingsController.getBookingById(req, res, next));

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags:
 *       - Bookings
 *     summary: Cancel booking and refund
 *     description: Cancel an active consultation booking. Automatically releases the educator slot and refunds the full consultation fee back to the student wallet.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 300
 *                 example: "Schedule conflict"
 *     responses:
 *       200:
 *         description: Booking cancelled and refund credited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Cannot cancel already completed or cancelled booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.patch('/:id/cancel', validateBody(cancelBookingSchema), (req, res, next) =>
  bookingsController.cancelBooking(req, res, next),
);
