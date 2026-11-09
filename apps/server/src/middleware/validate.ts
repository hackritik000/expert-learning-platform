import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema, type ZodType } from 'zod';

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

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      });
      return;
    }

    res.locals.query = result.data;
    next();
  };
}
