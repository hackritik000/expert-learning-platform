import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { educatorsRouter, subjectsRouter } from './modules/educators/educators.routes';
import { walletRouter } from './modules/wallet/wallet.routes';

export const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Server health check
 *     description: Returns current operational status and server ISO timestamp.
 *     security: []
 *     responses:
 *       200:
 *         description: Server is online and healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-11-06T10:00:00.000Z"
 */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger JSON Spec Endpoint
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Interactive Swagger UI
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Expert Consultation Platform API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
    },
  }),
);

// Mount Modules
app.use('/api/auth', authRouter);
app.use('/api/educators', educatorsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/chats', chatRouter);

// Centralized Error Handler
app.use(errorHandler);
