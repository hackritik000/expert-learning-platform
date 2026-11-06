import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../database/db';
import { users, wallets } from '../../database/schema';
import { ENV } from '../../config/env';
import type { LoginFormData, RegisterFormData } from '@expert/validation';

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

  private generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });
  }
}

export const authService = new AuthService();
