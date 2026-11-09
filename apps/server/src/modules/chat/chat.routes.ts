import { sendMessageSchema } from '@repo/validation';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { chatController } from './chat.controller';

export const chatRouter = Router();

chatRouter.use(requireAuth);

/**
 * @openapi
 * /api/chats:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List user consultation chat rooms
 *     description: Retrieve all active chat conversations between the authenticated user and educators, including online status, last message preview, and unread counts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active chat rooms
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
 *                     $ref: '#/components/schemas/ChatRoom'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
chatRouter.get('/', chatController.getUserChats);

/**
 * @openapi
 * /api/chats/educator/{educatorId}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get or create chat room with educator
 *     description: Retrieve existing chat conversation with the specified educator or create a new room if none exists.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Educator UUID
 *     responses:
 *       200:
 *         description: Chat room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatRoom'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
chatRouter.get('/educator/:educatorId', chatController.getOrCreateChatByEducator);

/**
 * @openapi
 * /api/chats/{id}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat room details
 *     description: Retrieve chat room details by chat room UUID or educator UUID for consultation messaging.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room UUID or Educator UUID
 *     responses:
 *       200:
 *         description: Chat room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatRoom'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
chatRouter.get('/:id', chatController.getChatById);

/**
 * @openapi
 * /api/chats/{id}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat room message history
 *     description: Fetch all chronological messages exchanged in a consultation chat room.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room UUID
 *     responses:
 *       200:
 *         description: Message history list
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
 *                     $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send message in chat room
 *     description: Post a text message to the consultation chat room.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: "Hello, I wanted to ask about the assignment problem."
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Validation failed or empty message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
chatRouter.get('/:id/messages', chatController.getChatMessages);

chatRouter.post('/:id/messages', validateBody(sendMessageSchema), chatController.sendMessage);
