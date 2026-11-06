import type { Request, Response, NextFunction } from 'express';
import { educatorsService } from './educators.service';

export class EducatorsController {
  async getEducators(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await educatorsService.getEducators(req.query as any);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async getEducatorById(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await educatorsService.getEducatorById(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async getSubjects(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await educatorsService.getSubjects();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async getEducatorSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await educatorsService.getEducatorSlots(
        req.params.id as string,
        req.query.date as string | undefined,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }
}

export const educatorsController = new EducatorsController();
