import { pgTable, text, timestamp, uuid, integer, boolean, real } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('student'), // 'student' | 'educator' | 'admin'
  avatarUrl: text('avatar_url'),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const educators = pgTable('educators', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title').notNull(),
  bio: text('bio').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  rating: real('rating').notNull().default(5.0),
  reviewCount: integer('review_count').notNull().default(0),
  experienceYears: integer('experience_years').notNull().default(1),
  hourlyRate: integer('hourly_rate').notNull().default(500),
  isOnline: boolean('is_online').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(true),
  education: text('education').notNull(),
  languages: text('languages').array().notNull().default(sql`ARRAY['English']::text[]`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  iconName: text('icon_name').notNull().default('BookOpen'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const educatorSubjects = pgTable('educator_subjects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  educatorId: uuid('educator_id')
    .references(() => educators.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: uuid('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
});

export const educatorAvailability = pgTable('educator_availability', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  educatorId: uuid('educator_id')
    .references(() => educators.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  isBooked: boolean('is_booked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  educatorId: uuid('educator_id')
    .references(() => educators.id, { onDelete: 'cascade' })
    .notNull(),
  slotId: uuid('slot_id')
    .references(() => educatorAvailability.id, { onDelete: 'cascade' })
    .notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('confirmed'), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  educatorId: uuid('educator_id')
    .references(() => educators.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  chatId: uuid('chat_id')
    .references(() => chats.id, { onDelete: 'cascade' })
    .notNull(),
  senderId: uuid('sender_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  senderRole: text('sender_role').notNull().default('student'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  balance: integer('balance').notNull().default(1000), // Default welcome credit of ₹1,000 for instant testing
  currency: text('currency').notNull().default('INR'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  walletId: uuid('wallet_id')
    .references(() => wallets.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // 'recharge' | 'consultation_payment' | 'refund'
  status: text('status').notNull().default('success'), // 'pending' | 'success' | 'failed'
  description: text('description').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  educatorId: uuid('educator_id')
    .references(() => educators.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  rating: integer('rating').notNull().default(5),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
