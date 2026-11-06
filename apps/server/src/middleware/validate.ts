import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        res.status(400).json({ success: false, error: errorMessages, details: error.errors });
        return;
      }
      res.status(400).json({ success: false, error: 'Invalid request data' });
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        res.status(400).json({ success: false, error: errorMessages, details: error.errors });
        return;
      }
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
    }
  };
}
