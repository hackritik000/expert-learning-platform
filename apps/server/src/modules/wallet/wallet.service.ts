import type { RechargeInput, WithdrawInput } from '@repo/validation';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../database/db';
import { users, wallets, walletTransactions } from '../../database/schema';

export class WalletService {
  async getWallet(userId: string) {
    const [existingWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const [wallet] = existingWallet
      ? [existingWallet]
      : await db
          .insert(wallets)
          .values({
            userId,
            balance: 0,
            currency: 'INR',
          })
          .onConflictDoNothing({ target: wallets.userId })
          .returning();

    // Another concurrent request may have created the wallet first.
    const result =
      wallet ?? (await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1))[0];

    if (!result) {
      throw new Error('Failed to retrieve or create wallet');
    }

    return {
      id: result.id,
      userId: result.userId,
      balance: result.balance,
      currency: result.currency,
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  async rechargeWallet(userId: string, data: RechargeInput) {
    // Check if user is an educator - educators cannot add/recharge money
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (user?.role === 'educator') {
      throw new Error('Educators cannot recharge wallet. Wallet funds are earned through consultation bookings.');
    }

    return db.transaction(async (tx) => {
      // Ensure the wallet exists. The unique userId constraint prevents duplicates.
      await tx
        .insert(wallets)
        .values({
          userId,
          balance: 0,
          currency: 'INR',
        })
        .onConflictDoNothing({ target: wallets.userId });

      // Lock the wallet row until the transaction completes.
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update')
        .limit(1);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const newBalance = wallet.balance + data.amount;
      const refId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await tx
        .update(wallets)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      const [transaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          userId,
          amount: data.amount,
          type: 'recharge',
          status: 'success',
          description: `Wallet Recharge via ${data.paymentMethod?.toUpperCase() || 'UPI'}`,
          referenceId: refId,
        })
        .returning();

      if (!transaction) {
        throw new Error('Failed to create wallet transaction');
      }

      return {
        balance: newBalance,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt.toISOString(),
        },
      };
    });
  }

  async withdrawWallet(userId: string, data: WithdrawInput) {
    return db.transaction(async (tx) => {
      // Lock the wallet row
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update')
        .limit(1);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < data.amount) {
        throw new Error(`Insufficient wallet balance. Available: ₹${wallet.balance}, Requested: ₹${data.amount}`);
      }

      const newBalance = wallet.balance - data.amount;
      const refId = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await tx
        .update(wallets)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      const [transaction] = await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          userId,
          amount: -data.amount,
          type: 'withdrawal',
          status: 'success',
          description: `Payout Withdrawal to ${data.accountDetails || 'UPI / Bank'}`,
          referenceId: refId,
        })
        .returning();

      if (!transaction) {
        throw new Error('Failed to record withdrawal transaction');
      }

      return {
        balance: newBalance,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt.toISOString(),
        },
      };
    });
  }

  async getTransactions(userId: string) {
    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));

    return transactions.map((transaction) => ({
      id: transaction.id,
      walletId: transaction.walletId,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt.toISOString(),
    }));
  }
}

export const walletService = new WalletService();
