import { evaluateSessionAccess } from '@repo/shared';
import { and, asc, desc, eq, ne, or, sql } from 'drizzle-orm';
import { db } from '../../database/db';
import { bookings, chats, educators, messages, users } from '../../database/schema';

export class ChatService {
  async getUserChats(userId: string, role: string) {
    if (role === 'educator') {
      const [educator] = await db.select().from(educators).where(eq(educators.userId, userId));

      if (!educator) {
        return [];
      }

      const chatList = await db
        .select({
          id: chats.id,
          educatorId: chats.educatorId,
          userId: chats.userId,
          educatorName: educators.name,
          educatorAvatar: educators.avatarUrl,
          isOnline: educators.isOnline,
          userName: users.name,
          userAvatar: users.avatarUrl,
          lastMessage: sql<string | null>`(
            SELECT ${messages.content}
            FROM ${messages}
            WHERE ${messages.chatId} = ${chats.id}
            ORDER BY ${messages.createdAt} DESC
            LIMIT 1
          )`,
          lastMessageAt: sql<Date | null>`(
            SELECT ${messages.createdAt}
            FROM ${messages}
            WHERE ${messages.chatId} = ${chats.id}
            ORDER BY ${messages.createdAt} DESC
            LIMIT 1
          )`,
        })
        .from(chats)
        .innerJoin(educators, eq(chats.educatorId, educators.id))
        .innerJoin(users, eq(chats.userId, users.id))
        .where(and(eq(chats.educatorId, educator.id), ne(chats.userId, userId)))
        .orderBy(desc(sql`COALESCE(${chats.updatedAt}, ${chats.createdAt})`));

      const chatsWithSession = await Promise.all(
        chatList.map(async (chat) => {
          const studentBookings = await db
            .select({
              id: bookings.id,
              date: bookings.date,
              startTime: bookings.startTime,
              endTime: bookings.endTime,
              status: bookings.status,
            })
            .from(bookings)
            .where(
              and(
                eq(bookings.userId, chat.userId),
                eq(bookings.educatorId, chat.educatorId),
                eq(bookings.status, 'confirmed'),
              ),
            );

          const sessionStatus = evaluateSessionAccess(studentBookings);

          return {
            ...chat,
            lastMessage: chat.lastMessage ?? null,
            lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt).toISOString() : null,
            unreadCount: 0,
            sessionStatus,
          };
        }),
      );

      return chatsWithSession;
    }

    const chatList = await db
      .select({
        id: chats.id,
        educatorId: chats.educatorId,
        userId: chats.userId,
        educatorName: educators.name,
        educatorAvatar: educators.avatarUrl,
        isOnline: educators.isOnline,
        userName: users.name,
        userAvatar: users.avatarUrl,
        lastMessage: sql<string | null>`(
          SELECT ${messages.content}
          FROM ${messages}
          WHERE ${messages.chatId} = ${chats.id}
          ORDER BY ${messages.createdAt} DESC
          LIMIT 1
        )`,
        lastMessageAt: sql<Date | null>`(
          SELECT ${messages.createdAt}
          FROM ${messages}
          WHERE ${messages.chatId} = ${chats.id}
          ORDER BY ${messages.createdAt} DESC
          LIMIT 1
        )`,
      })
      .from(chats)
      .innerJoin(educators, eq(chats.educatorId, educators.id))
      .innerJoin(users, eq(chats.userId, users.id))
      .where(and(eq(chats.userId, userId), ne(educators.userId, userId)))
      .orderBy(desc(sql`COALESCE(${chats.updatedAt}, ${chats.createdAt})`));

    const chatsWithSession = await Promise.all(
      chatList.map(async (chat) => {
        const studentBookings = await db
          .select({
            id: bookings.id,
            date: bookings.date,
            startTime: bookings.startTime,
            endTime: bookings.endTime,
            status: bookings.status,
          })
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, chat.userId),
              eq(bookings.educatorId, chat.educatorId),
              eq(bookings.status, 'confirmed'),
            ),
          );

        const sessionStatus = evaluateSessionAccess(studentBookings);

        return {
          ...chat,
          lastMessage: chat.lastMessage ?? null,
          lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt).toISOString() : null,
          unreadCount: 0,
          sessionStatus,
        };
      }),
    );

    return chatsWithSession;
  }

  async getChatById(userId: string, targetId: string) {
    // 1. Check if targetId matches an existing chat ID
    const [chat] = await db
      .select({
        id: chats.id,
        educatorId: chats.educatorId,
        userId: chats.userId,
        educatorName: educators.name,
        educatorAvatar: educators.avatarUrl,
        isOnline: educators.isOnline,
        educatorUserId: educators.userId,
        userName: users.name,
        userAvatar: users.avatarUrl,
      })
      .from(chats)
      .innerJoin(educators, eq(chats.educatorId, educators.id))
      .innerJoin(users, eq(chats.userId, users.id))
      .where(eq(chats.id, targetId));

    if (chat) {
      if (chat.userId === chat.educatorUserId) {
        throw new Error('Self-chat is not allowed');
      }

      if (chat.userId !== userId && chat.educatorUserId !== userId) {
        throw new Error('Not authorized to access this chat');
      }

      const studentBookings = await db
        .select({
          id: bookings.id,
          date: bookings.date,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          status: bookings.status,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, chat.userId),
            eq(bookings.educatorId, chat.educatorId),
            eq(bookings.status, 'confirmed'),
          ),
        );

      const sessionStatus = evaluateSessionAccess(studentBookings);

      return {
        id: chat.id,
        educatorId: chat.educatorId,
        educatorName: chat.educatorName,
        educatorAvatar: chat.educatorAvatar,
        isOnline: chat.isOnline,
        userId: chat.userId,
        userName: chat.userName,
        userAvatar: chat.userAvatar,
        sessionStatus,
      };
    }

    // 2. If no chat room found with this ID, check if targetId is an educator ID (for student starting chat)
    const [educator] = await db.select().from(educators).where(eq(educators.id, targetId));
    if (educator) {
      if (educator.userId === userId) {
        throw new Error('Educators cannot start a chat with themselves');
      }
      return this.getOrCreateChatByEducator(userId, targetId);
    }

    throw new Error('Chat not found');
  }

  async getOrCreateChatByEducator(userId: string, educatorId: string) {
    const [educator] = await db.select().from(educators).where(eq(educators.id, educatorId));
    if (!educator) {
      throw new Error('Educator not found');
    }

    if (educator.userId === userId) {
      throw new Error('Educators cannot start a chat with themselves');
    }

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
        .onConflictDoNothing()
        .returning();

      // Handle concurrent chat creation
      if (!chat) {
        [chat] = await db
          .select()
          .from(chats)
          .where(and(eq(chats.userId, userId), eq(chats.educatorId, educatorId)));
      }
    }

    if (!chat) {
      throw new Error('Unable to create or retrieve chat');
    }

    const [student] = await db.select().from(users).where(eq(users.id, userId));

    const studentBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.educatorId, educatorId),
          eq(bookings.status, 'confirmed'),
        ),
      );

    const sessionStatus = evaluateSessionAccess(studentBookings);

    return {
      id: chat.id,
      educatorId: chat.educatorId,
      educatorName: educator.name,
      educatorAvatar: educator.avatarUrl,
      isOnline: educator.isOnline,
      userId: chat.userId,
      userName: student?.name || 'Student',
      userAvatar: student?.avatarUrl || '',
      sessionStatus,
    };
  }

  async getChatMessages(userId: string, chatId: string) {
    // Verify user participates in chat (either student or educator)
    const [chat] = await db
      .select({
        id: chats.id,
        educatorId: chats.educatorId,
        userId: chats.userId,
        educatorUserId: educators.userId,
      })
      .from(chats)
      .innerJoin(educators, eq(chats.educatorId, educators.id))
      .where(and(eq(chats.id, chatId), or(eq(chats.userId, userId), eq(educators.userId, userId))));

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.userId === chat.educatorUserId) {
      throw new Error('Self-chat is not allowed');
    }

    const msgList = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        senderRole: messages.senderRole,
        content: messages.content,
        createdAt: messages.createdAt,
        senderName: users.name,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    return msgList.map((message) => ({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  async sendMessage(userId: string, chatId: string, content: string) {
    // Verify user participates in chat (either student or educator)
    const [chat] = await db
      .select({
        id: chats.id,
        educatorId: chats.educatorId,
        userId: chats.userId,
        educatorUserId: educators.userId,
      })
      .from(chats)
      .innerJoin(educators, eq(chats.educatorId, educators.id))
      .where(and(eq(chats.id, chatId), or(eq(chats.userId, userId), eq(educators.userId, userId))));

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.userId === chat.educatorUserId) {
      throw new Error('You cannot send messages to yourself');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const isEducator = chat.educatorUserId === userId;
    const senderRole: 'educator' | 'student' = isEducator ? 'educator' : 'student';

    // Verify session timing for consultation chat
    const studentBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, chat.userId),
          eq(bookings.educatorId, chat.educatorId),
          eq(bookings.status, 'confirmed'),
        ),
      );

    const access = evaluateSessionAccess(studentBookings, new Date());

    if (!isEducator && !access.canChat) {
      const err = new Error(access.message);
      (err as any).statusCode = 403;
      (err as any).sessionStatus = access.status;
      throw err;
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        chatId,
        senderId: userId,
        senderRole,
        content,
      })
      .returning();

    // Update chat timestamp
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

    // Simulated educator response (only if sent by student during active session)
    if (!isEducator && access.canChat) {
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
        } catch (_error) {
          // Ignore simulated background response errors
        }
      }, 1200);
    }

    return {
      id: newMessage.id,
      chatId: newMessage.chatId,
      senderId: newMessage.senderId,
      senderName: user?.name || (isEducator ? 'Educator' : 'Student'),
      senderRole: newMessage.senderRole,
      content: newMessage.content,
      createdAt: newMessage.createdAt.toISOString(),
    };
  }
}

export const chatService = new ChatService();
