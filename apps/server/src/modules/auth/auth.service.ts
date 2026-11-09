import type { LoginFormData, RegisterFormData, UpdateUserProfileFormData } from '@repo/validation';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import { db } from '../../database/db';
import { educatorSubjects, educators, subjects, users, wallets } from '../../database/schema';

export class AuthService {
  async register(data: RegisterFormData) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role || 'student',
      })
      .returning();

    // Create wallet for new user with ₹500 initial bonus credit!
    await db.insert(wallets).values({
      userId: newUser.id,
      balance: 500,
      currency: 'INR',
    });

    // If registered as educator, automatically create their initial educator profile
    if (newUser.role === 'educator') {
      const defaultSubjects = await db.select().from(subjects).limit(1);
      const [newEducator] = await db
        .insert(educators)
        .values({
          userId: newUser.id,
          name: newUser.name,
          title: 'Professional Educator',
          bio: 'Passionate educator dedicated to student success and interactive learning.',
          avatarUrl:
            newUser.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          experienceYears: 1,
          hourlyRate: 500,
          education: 'Professional Educator',
          languages: ['English'],
          rating: 5.0,
          reviewCount: 0,
          isOnline: false,
          isVerified: true,
        })
        .returning();

      if (defaultSubjects.length > 0) {
        await db.insert(educatorSubjects).values({
          educatorId: newEducator.id,
          subjectId: defaultSubjects[0].id,
        });
      }
    }

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        phoneNumber: newUser.phoneNumber,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      },
      token,
      expiresIn: ENV.JWT_EXPIRES_IN,
    };
  }

  async login(data: LoginFormData) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token,
      expiresIn: ENV.JWT_EXPIRES_IN,
    };
  }

  async getMe(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateProfile(userId: string, data: UpdateUserProfileFormData) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined && data.name.trim() !== '') {
      updateValues.name = data.name.trim();
    }
    if (data.phoneNumber !== undefined) {
      updateValues.phoneNumber = data.phoneNumber;
    }
    if (data.avatarUrl !== undefined && data.avatarUrl !== '') {
      updateValues.avatarUrl = data.avatarUrl;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning();

    // If user is also an educator, sync name and avatarUrl
    if (updatedUser.role === 'educator') {
      const eduUpdate: Partial<typeof educators.$inferInsert> = {};
      if (data.name !== undefined && data.name.trim() !== '') {
        eduUpdate.name = data.name.trim();
      }
      if (data.avatarUrl !== undefined && data.avatarUrl !== '') {
        eduUpdate.avatarUrl = data.avatarUrl;
      }
      if (Object.keys(eduUpdate).length > 0) {
        eduUpdate.updatedAt = new Date();
        await db.update(educators).set(eduUpdate).where(eq(educators.userId, userId));
      }
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
      phoneNumber: updatedUser.phoneNumber,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });
  }
}

export const authService = new AuthService();
