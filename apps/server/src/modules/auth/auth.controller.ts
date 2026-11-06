import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response) {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();
