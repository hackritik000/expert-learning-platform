import type React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wallet, PlusCircle } from 'lucide-react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

interface WalletBalanceCardProps {
  balance: number;
  onRechargePress?: () => void;
  compact?: boolean;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  balance,
  onRechargePress,
  compact = false,
}) => {
  if (compact) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onRechargePress}
        style={styles.compactContainer}
      >
        <Wallet size={16} color={colors.primary} />
        <Text style={styles.compactBalance}>₹{balance.toLocaleString('en-IN')}</Text>
        <PlusCircle size={14} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Wallet size={18} color={colors.white} />
          <Text style={styles.label}>Available Wallet Balance</Text>
        </View>
        <Text style={styles.currency}>INR</Text>
      </View>
      <View style={styles.balanceRow}>
        <Text style={styles.amount}>₹{balance.toLocaleString('en-IN')}</Text>
        {onRechargePress && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRechargePress}
            style={styles.rechargeBtn}
          >
            <PlusCircle size={16} color={colors.primary} />
            <Text style={styles.rechargeBtnText}>Add Money</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
  },
  compactBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  currency: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 6,
    ...shadows.sm,
  },
  rechargeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
