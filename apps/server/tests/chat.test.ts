import { describe, expect, it } from 'bun:test';
import { sendMessageSchema } from '@repo/validation';
import { chatService } from '../src/modules/chat/chat.service';
import { db } from '../src/database/db';
import { educators, users } from '../src/database/schema';
import { eq } from 'drizzle-orm';

describe('Chat & Educator Reply Feature Tests', () => {
  describe('Message Validation Schema', () => {
    it('should validate a valid reply message', () => {
      const result = sendMessageSchema.safeParse({
        content: 'Hello! I am happy to help you with your coursework.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Hello! I am happy to help you with your coursework.');
      }
    });

    it('should reject empty message', () => {
      const result = sendMessageSchema.safeParse({
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only message', () => {
      const result = sendMessageSchema.safeParse({
        content: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('should reject messages exceeding maximum length', () => {
      const longMessage = 'a'.repeat(2001);
      const result = sendMessageSchema.safeParse({
        content: longMessage,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Educator Reply Service Logic', () => {
    it('should allow educator to fetch their chat rooms and see student information', async () => {
      // Find demo educator user
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      expect(educatorUser).toBeDefined();

      const chatsList = await chatService.getUserChats(educatorUser.id, 'educator');
      expect(Array.isArray(chatsList)).toBe(true);
      expect(chatsList.length).toBeGreaterThan(0);

      // Verify chat room structure
      const chat = chatsList[0];
      expect(chat.id).toBeDefined();
      expect(chat.educatorId).toBeDefined();
      expect(chat.userName).toBeDefined();
      expect(chat.educatorName).toBe('Dr. Ananya Verma');
    });

    it('should allow educator to fetch message history for their consultation chat', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      const chatsList = await chatService.getUserChats(educatorUser.id, 'educator');
      const targetChat = chatsList.find((c) => c.userName === 'Rohan Sharma') || chatsList[0];

      const messages = await chatService.getChatMessages(educatorUser.id, targetChat.id);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].chatId).toBe(targetChat.id);
    });

    it('should allow educator to post a reply message with senderRole="educator"', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      const chatsList = await chatService.getUserChats(educatorUser.id, 'educator');
      const targetChat = chatsList.find((c) => c.userName === 'Rohan Sharma') || chatsList[0];

      const replyContent = 'Unit test educator reply: I will review your preparation notes.';
      const sentMessage = await chatService.sendMessage(
        educatorUser.id,
        targetChat.id,
        replyContent,
      );

      expect(sentMessage).toBeDefined();
      expect(sentMessage.content).toBe(replyContent);
      expect(sentMessage.senderRole).toBe('educator');
      expect(sentMessage.senderId).toBe(educatorUser.id);
      expect(sentMessage.senderName).toBe('Dr. Ananya Verma');
    });

    it('should reject unauthorized user attempting to reply to a chat', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      const chatsList = await chatService.getUserChats(educatorUser.id, 'educator');
      const targetChat = chatsList[0];

      // Random stranger UUID
      const strangerId = '00000000-0000-0000-0000-000000000000';

      expect(
        chatService.sendMessage(strangerId, targetChat.id, 'Unauthorized message'),
      ).rejects.toThrow('Chat not found');
    });

    it('should allow fetching chat room details by chatId for authorized educator', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      const chatsList = await chatService.getUserChats(educatorUser.id, 'educator');
      const targetChat = chatsList[0];

      const room = await chatService.getChatById(educatorUser.id, targetChat.id);
      expect(room).toBeDefined();
      expect(room.id).toBe(targetChat.id);
      expect(room.educatorName).toBe('Dr. Ananya Verma');
    });

    it('should prevent an educator from starting a chat with themselves', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      const [educator] = await db
        .select()
        .from(educators)
        .where(eq(educators.userId, educatorUser.id));

      expect(educator).toBeDefined();

      // Attempting to create or get a chat with own educator ID must fail
      expect(chatService.getOrCreateChatByEducator(educatorUser.id, educator.id)).rejects.toThrow(
        'Educators cannot start a chat with themselves',
      );

      // Attempting getChatById with own educator ID must also fail
      expect(chatService.getChatById(educatorUser.id, educator.id)).rejects.toThrow(
        'Educators cannot start a chat with themselves',
      );
    });

    it('should never include self-chats in getUserChats list', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      const chatsList = await chatService.getUserChats(educatorUser.id, 'educator');
      const selfChat = chatsList.find((c) => c.userId === educatorUser.id);
      expect(selfChat).toBeUndefined();
    });
  });
});
