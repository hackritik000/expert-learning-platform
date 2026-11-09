import { asyncHandler } from '../../middleware/asyncHandler';
import { chatService } from './chat.service';

export class ChatController {
  getUserChats = asyncHandler(async (req, res) => {
    const result = await chatService.getUserChats(req.user!.userId, req.user!.role);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getOrCreateChatByEducator = asyncHandler(async (req, res) => {
    const result = await chatService.getOrCreateChatByEducator(
      req.user!.userId,
      req.params.educatorId as string,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getChatById = asyncHandler(async (req, res) => {
    const result = await chatService.getChatById(req.user!.userId, req.params.id as string);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getChatMessages = asyncHandler(async (req, res) => {
    const result = await chatService.getChatMessages(req.user!.userId, req.params.id as string);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  sendMessage = asyncHandler(async (req, res) => {
    const result = await chatService.sendMessage(
      req.user!.userId,
      req.params.id as string,
      req.body.content,
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  });
}

export const chatController = new ChatController();
