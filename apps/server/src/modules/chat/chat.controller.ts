import type { Request, Response, NextFunction } from 'express';
import { chatService } from './chat.service';

export class ChatController {
  async getUserChats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await chatService.getUserChats(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async getOrCreateChatByEducator(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await chatService.getOrCreateChatByEducator(
        req.user!.userId,
        req.params.educatorId as string,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async getChatMessages(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await chatService.getChatMessages(req.user!.userId, req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async sendMessage(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await chatService.sendMessage(
        req.user!.userId,
        req.params.id as string,
        req.body.content,
      );
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const chatController = new ChatController();
