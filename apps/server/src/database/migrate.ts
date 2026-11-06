import { sqlClient } from './db';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    await sqlClient`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

    // Users table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        avatar_url TEXT,
        phone_number TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Educators table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS educators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        bio TEXT NOT NULL,
        avatar_url TEXT NOT NULL,
        rating REAL NOT NULL DEFAULT 5.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        experience_years INTEGER NOT NULL DEFAULT 1,
        hourly_rate INTEGER NOT NULL DEFAULT 500,
        is_online BOOLEAN NOT NULL DEFAULT false,
        is_verified BOOLEAN NOT NULL DEFAULT true,
        education TEXT NOT NULL,
        languages TEXT[] NOT NULL DEFAULT ARRAY['English']::TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Subjects table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        icon_name TEXT NOT NULL DEFAULT 'BookOpen',
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Educator Subjects table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS educator_subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        educator_id UUID REFERENCES educators(id) ON DELETE CASCADE NOT NULL,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
        UNIQUE (educator_id, subject_id)
      );
    `;

    // Educator Availability table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS educator_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        educator_id UUID REFERENCES educators(id) ON DELETE CASCADE NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_booked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Bookings table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        educator_id UUID REFERENCES educators(id) ON DELETE CASCADE NOT NULL,
        slot_id UUID REFERENCES educator_availability(id) ON DELETE CASCADE NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Chats table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        educator_id UUID REFERENCES educators(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE (educator_id, user_id)
      );
    `;

    // Messages table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        sender_role TEXT NOT NULL DEFAULT 'student',
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Wallets table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        balance INTEGER NOT NULL DEFAULT 1000,
        currency TEXT NOT NULL DEFAULT 'INR',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Wallet Transactions table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'success',
        description TEXT NOT NULL,
        reference_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Reviews table
    await sqlClient`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        educator_id UUID REFERENCES educators(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL DEFAULT 5,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    console.log('✅ Database tables migrated successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (import.meta.main) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
