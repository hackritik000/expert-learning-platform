import { and, eq, desc, asc } from 'drizzle-orm';
import { db, sqlClient } from '../../database/db';
import { chats, messages, educators, users } from '../../database/schema';

export class ChatService {
  async getUserChats(userId: string) {
    const chatList = await sqlClient`
      SELECT 
        c.id, c.educator_id, c.user_id, c.created_at, c.updated_at,
        e.name as educator_name, e.avatar_url as educator_avatar, e.is_online,
        u.name as user_name,
        (
          SELECT content FROM messages m 
          WHERE m.chat_id = c.id 
          ORDER BY m.created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM messages m 
          WHERE m.chat_id = c.id 
          ORDER BY m.created_at DESC LIMIT 1
        ) as last_message_at
      FROM chats c
      JOIN educators e ON e.id = c.educator_id
      JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ${userId}
      ORDER BY COALESCE(c.updated_at, c.created_at) DESC
    `;

    return chatList.map((c: any) => ({
      id: c.id,
      educatorId: c.educator_id,
      educatorName: c.educator_name,
      educatorAvatar: c.educator_avatar,
      isOnline: c.is_online,
      userId: c.user_id,
      userName: c.user_name,
      lastMessage: c.last_message || null,
      lastMessageAt: c.last_message_at || null,
      unreadCount: 0,
    }));
  }

  async getOrCreateChatByEducator(userId: string, educatorId: string) {
    let [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.userId, userId), eq(chats.educatorId, educatorId)));

    if (!chat) {
      [chat] = await db
        .insert(chats)
        .values({
          userId,
          educatorId,
        })
        .returning();
    }

    const [educator] = await db.select().from(educators).where(eq(educators.id, educatorId));

    return {
      id: chat.id,
      educatorId: chat.educatorId,
      educatorName: educator?.name || 'Educator',
      educatorAvatar: educator?.avatarUrl || '',
      isOnline: educator?.isOnline || false,
      userId: chat.userId,
    };
  }

  async getChatMessages(userId: string, chatId: string) {
    // Verify user owns chat
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

    if (!chat) {
      throw new Error('Chat not found');
    }

    const msgList = await sqlClient`
      SELECT m.id, m.chat_id, m.sender_id, m.sender_role, m.content, m.created_at, u.name as sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.chat_id = ${chatId}
      ORDER BY m.created_at ASC
    `;

    return msgList.map((m: any) => ({
      id: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderRole: m.sender_role,
      content: m.content,
      createdAt: m.created_at,
    }));
  }

  async sendMessage(userId: string, chatId: string, content: string) {
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

    if (!chat) {
      throw new Error('Chat not found');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const [newMessage] = await db
      .insert(messages)
      .values({
        chatId,
        senderId: userId,
        senderRole: 'student',
        content,
      })
      .returning();

    // Update chat timestamp
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

    // Simulated educator response after a short timeout to provide an interactive AstroTalk-like feel
    setTimeout(async () => {
      try {
        const [educator] = await db
          .select()
          .from(educators)
          .where(eq(educators.id, chat.educatorId));

        if (educator?.userId) {
          const autoReplies = [
            `Thank you for reaching out! I've noted down your question: "${content.slice(0, 30)}..." and I look forward to discussing it during our consultation.`,
            'Glad to hear from you! Please feel free to share any syllabus details or specific topics before our upcoming session.',
            `Got your message! I'm reviewing the topics and will prepare customized notes for our consultation.`,
          ];
          const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];

          await db.insert(messages).values({
            chatId,
            senderId: educator.userId,
            senderRole: 'educator',
            content: replyText,
          });

          await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
        }
      } catch (_e) {
        // Silent catch for background reply
      }
    }, 1200);

    return {
      id: newMessage.id,
      chatId: newMessage.chatId,
      senderId: newMessage.senderId,
      senderName: user?.name || 'Student',
      senderRole: newMessage.senderRole,
      content: newMessage.content,
      createdAt: newMessage.createdAt.toISOString(),
    };
  }
}

export const chatService = new ChatService();
