import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ==========================================
// ENUMS
// ==========================================

export const userRoleEnum = pgEnum('user_role', ['student', 'educator', 'admin']);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'recharge',
  'consultation_payment',
  'refund',
  'withdrawal',
]);

export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'success', 'failed']);

export const senderRoleEnum = pgEnum('sender_role', ['student', 'educator']);

// ==========================================
// USERS
// ==========================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    role: userRoleEnum('role').default('student').notNull(),
    avatarUrl: text('avatar_url'),
    phoneNumber: text('phone_number'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`),
    index('users_role_idx').on(table.role),
  ],
);

// ==========================================
// EDUCATORS
// ==========================================

export const educators = pgTable(
  'educators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
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
  },
  (table) => [
    unique('educators_user_id_unique').on(table.userId),
    check('educators_rating_check', sql`${table.rating} >= 0 AND ${table.rating} <= 5`),
    check('educators_review_count_check', sql`${table.reviewCount} >= 0`),
    check('educators_experience_check', sql`${table.experienceYears} >= 0`),
    check('educators_hourly_rate_check', sql`${table.hourlyRate} > 0`),
    index('educators_online_idx').on(table.isOnline),
    index('educators_rating_idx').on(table.rating),
  ],
);

// ==========================================
// SUBJECTS
// ==========================================

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  iconName: text('icon_name').notNull().default('BookOpen'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// EDUCATOR SUBJECTS
// ==========================================

export const educatorSubjects = pgTable(
  'educator_subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    educatorId: uuid('educator_id')
      .references(() => educators.id, { onDelete: 'cascade' })
      .notNull(),
    subjectId: uuid('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [
    unique('educator_subject_unique').on(table.educatorId, table.subjectId),
    index('educator_subjects_subject_idx').on(table.subjectId),
  ],
);

// ==========================================
// EDUCATOR AVAILABILITY
// ==========================================

export const educatorAvailability = pgTable(
  'educator_availability',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    educatorId: uuid('educator_id')
      .references(() => educators.id, { onDelete: 'cascade' })
      .notNull(),
    date: text('date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    isBooked: boolean('is_booked').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('educator_slot_unique').on(table.educatorId, table.date, table.startTime, table.endTime),
    check('educator_availability_time_check', sql`${table.startTime} < ${table.endTime}`),
    index('educator_availability_date_idx').on(table.educatorId, table.date),
  ],
);

// ==========================================
// BOOKINGS
// ==========================================

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    educatorId: uuid('educator_id')
      .references(() => educators.id, { onDelete: 'restrict' })
      .notNull(),
    slotId: uuid('slot_id')
      .references(() => educatorAvailability.id, { onDelete: 'restrict' })
      .notNull(),
    date: text('date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    amount: integer('amount').notNull(),
    status: bookingStatusEnum('status').default('confirmed').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // A slot can have only one active booking.
    // Cancelled bookings do not prevent future bookings.
    uniqueIndex('bookings_active_slot_unique')
      .on(table.slotId)
      .where(sql`${table.status} <> 'cancelled'`),
    check('bookings_amount_check', sql`${table.amount} > 0`),
    check('bookings_time_check', sql`${table.startTime} < ${table.endTime}`),
    index('bookings_user_created_idx').on(table.userId, table.createdAt),
    index('bookings_educator_date_idx').on(table.educatorId, table.date),
    index('bookings_status_idx').on(table.status),
  ],
);

// ==========================================
// CHATS
// ==========================================

export const chats = pgTable(
  'chats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    educatorId: uuid('educator_id')
      .references(() => educators.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('chats_user_educator_unique').on(table.userId, table.educatorId),
    index('chats_user_updated_idx').on(table.userId, table.updatedAt),
  ],
);

// ==========================================
// MESSAGES
// ==========================================

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .references(() => chats.id, { onDelete: 'cascade' })
      .notNull(),
    senderId: uuid('sender_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    senderRole: senderRoleEnum('sender_role').default('student').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('messages_chat_created_idx').on(table.chatId, table.createdAt),
    index('messages_sender_idx').on(table.senderId),
  ],
);

// ==========================================
// WALLETS
// ==========================================

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull()
      .unique(),
    balance: integer('balance').notNull().default(1000),
    currency: text('currency').notNull().default('INR'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [check('wallet_balance_non_negative', sql`${table.balance} >= 0`)],
);

// ==========================================
// WALLET TRANSACTIONS
// ==========================================

export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .references(() => wallets.id, { onDelete: 'restrict' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    amount: integer('amount').notNull(),
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').default('success').notNull(),
    description: text('description').notNull(),
    referenceId: text('reference_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('wallet_transactions_wallet_created_idx').on(table.walletId, table.createdAt),
    index('wallet_transactions_user_idx').on(table.userId),
    index('wallet_transactions_reference_idx').on(table.referenceId),
  ],
);

// ==========================================
// REVIEWS
// ==========================================

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    educatorId: uuid('educator_id')
      .references(() => educators.id, { onDelete: 'restrict' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    rating: integer('rating').notNull().default(5),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('educator_user_review_unique').on(table.educatorId, table.userId),
    check('reviews_rating_check', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
    index('reviews_educator_created_idx').on(table.educatorId, table.createdAt),
  ],
);
