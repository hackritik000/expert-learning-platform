import type { WalletTransaction } from '@repo/shared';
import { ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react-native';
import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface TransactionItemProps {
  transaction: WalletTransaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isCredit = transaction.amount > 0;
  const isRefund = transaction.type === 'refund';
  const isWithdrawal = transaction.type === 'withdrawal';

  const renderIcon = () => {
    if (isRefund) {
      return (
        <View style={[styles.iconBox, { backgroundColor: colors.warningLight }]}>
          <RotateCcw size={18} color={colors.warning} />
        </View>
      );
    }
    if (isWithdrawal) {
      return (
        <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
          <ArrowUpRight size={18} color={colors.error} />
        </View>
      );
    }
    if (isCredit) {
      return (
        <View style={[styles.iconBox, { backgroundColor: colors.successLight }]}>
          <ArrowDownLeft size={18} color={colors.success} />
        </View>
      );
    }
    return (
      <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
        <ArrowUpRight size={18} color={colors.primary} />
      </View>
    );
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      {renderIcon()}
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <View style={styles.amountBox}>
        <Text style={[styles.amount, isCredit ? styles.amountPositive : styles.amountNegative]}>
          {isCredit ? `+₹${transaction.amount}` : `-₹${Math.abs(transaction.amount)}`}
        </Text>
        <Text style={styles.status}>{transaction.status}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountPositive: {
    color: colors.success,
  },
  amountNegative: {
    color: colors.text,
  },
  status: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'capitalize',
    marginTop: 2,
  },
});
