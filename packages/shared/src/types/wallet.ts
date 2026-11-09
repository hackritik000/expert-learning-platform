export type TransactionType = 'recharge' | 'consultation_payment' | 'refund' | 'withdrawal';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface RechargeRequest {
  amount: number;
  paymentMethod?: string;
}

export interface WithdrawRequest {
  amount: number;
  accountDetails?: string;
}
