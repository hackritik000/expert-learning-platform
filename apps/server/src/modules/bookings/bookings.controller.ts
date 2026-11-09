import { asyncHandler } from '../../middleware/asyncHandler';
import { bookingsService } from './bookings.service';

export class BookingsController {
  createBooking = asyncHandler(async (req, res) => {
    const result = await bookingsService.createBooking(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  getUserBookings = asyncHandler(async (req, res) => {
    const result = await bookingsService.getUserBookings(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getBookingById = asyncHandler(async (req, res) => {
    const result = await bookingsService.getBookingById(req.user!.userId, req.params.id as string);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  cancelBooking = asyncHandler(async (req, res) => {
    const result = await bookingsService.cancelBooking(
      req.user!.userId,
      req.params.id as string,
      req.body?.reason,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  completeBooking = asyncHandler(async (req, res) => {
    const result = await bookingsService.completeBooking(req.user!.userId, req.params.id as string);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getEducatorEarnings = asyncHandler(async (req, res) => {
    const result = await bookingsService.getEducatorEarnings(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export const bookingsController = new BookingsController();
