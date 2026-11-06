import type { Request, Response, NextFunction } from 'express';
import { bookingsService } from './bookings.service';

export class BookingsController {
  async createBooking(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await bookingsService.createBooking(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getUserBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingsService.getUserBookings(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await bookingsService.getBookingById(
        req.user!.userId,
        req.params.id as string,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async cancelBooking(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await bookingsService.cancelBooking(
        req.user!.userId,
        req.params.id as string,
        req.body?.reason,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const bookingsController = new BookingsController();
