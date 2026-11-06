import { eq, desc } from 'drizzle-orm';
import { db, sqlClient } from '../../database/db';
import { wallets, walletTransactions } from '../../database/schema';
import type { RechargeInput } from '@expert/validation';

export class WalletService {
  async getWallet(userId: string) {
    let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (!wallet) {
      [wallet] = await db
        .insert(wallets)
        .values({
          userId,
          balance: 0,
          currency: 'INR',
        })
        .returning();
    }

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }

  async rechargeWallet(userId: string, data: RechargeInput) {
    return await sqlClient.begin(async (tx) => {
      let [wallet] = await tx`
        SELECT * FROM wallets WHERE user_id = ${userId}
        FOR UPDATE
      `;

      if (!wallet) {
        [wallet] = await tx`
          INSERT INTO wallets (user_id, balance, currency)
          VALUES (${userId}, 0, 'INR')
          RETURNING *
        `;
      }

      const newBalance = wallet.balance + data.amount;
      const refId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await tx`
        UPDATE wallets
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${wallet.id}
      `;

      const [transaction] = await tx`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, amount, type, status, description, reference_id
        ) VALUES (
          ${wallet.id}, ${userId}, ${data.amount}, 'recharge', 'success',
          ${`Wallet Recharge via ${data.paymentMethod?.toUpperCase() || 'UPI'}`}, ${refId}
        )
        RETURNING *
      `;

      return {
        balance: newBalance,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          referenceId: transaction.reference_id,
          createdAt: transaction.created_at,
        },
      };
    });
  }

  async getTransactions(userId: string) {
    const list = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));

    return list.map((t) => ({
      id: t.id,
      walletId: t.walletId,
      userId: t.userId,
      amount: t.amount,
      type: t.type,
      status: t.status,
      description: t.description,
      referenceId: t.referenceId,
      createdAt: t.createdAt.toISOString(),
    }));
  }
}

export const walletService = new WalletService();
