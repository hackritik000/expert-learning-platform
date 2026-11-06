import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, CheckCircle2, X, History, ShieldCheck } from 'lucide-react-native';
import { type Wallet, type WalletTransaction, API_ROUTES, RECHARGE_PRESETS } from '@expert/shared';
import { apiClient } from '../../services/api';
import { queryClient } from '../../lib/queryClient';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { WalletBalanceCard } from '../../components/ui/WalletBalanceCard';
import { TransactionItem } from '../../components/ui/TransactionItem';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { InputField } from '../../components/ui/InputField';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPreset, setSelectedPreset] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);

  // Fetch Wallet Balance
  const {
    data: wallet,
    isLoading: loadingWallet,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Wallet }>(API_ROUTES.WALLET.GET);
      return res.data.data;
    },
  });

  // Fetch Transaction History
  const {
    data: transactions = [],
    isLoading: loadingTransactions,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: WalletTransaction[] }>(
        API_ROUTES.WALLET.TRANSACTIONS,
      );
      return res.data.data;
    },
  });

  // Recharge Mutation
  const rechargeMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiClient.post(API_ROUTES.WALLET.RECHARGE, {
        amount,
        paymentMethod: 'UPI / Card',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      setModalVisible(false);
      setPaymentSuccessModal(true);
    },
    onError: (err: any) => {
      Alert.alert('Recharge Failed', err.message || 'Unable to complete payment');
    },
  });

  const handleRechargeSubmit = () => {
    const rechargeAmount = customAmount ? Number.parseInt(customAmount, 10) : selectedPreset;
    if (Number.isNaN(rechargeAmount) || rechargeAmount < 50) {
      Alert.alert('Invalid Amount', 'Minimum recharge amount is ₹50');
      return;
    }
    rechargeMutation.mutate(rechargeAmount);
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTransactions()]);
    setRefreshing(false);
  };

  const finalAmount = customAmount ? Number.parseInt(customAmount, 10) : selectedPreset;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Consultation Wallet</Text>
        <Text style={styles.subtitle}>
          Secure pre-paid balance for instant bookings with zero hassle
        </Text>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Authoritative Balance Card */}
        {loadingWallet ? (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <LoadingSkeleton width="100%" height={140} borderRadius={16} />
          </View>
        ) : (
          <WalletBalanceCard
            balance={wallet?.balance ?? 0}
            onRechargePress={() => setModalVisible(true)}
          />
        )}

        {/* Quick Recharge Box */}
        <View style={styles.rechargeBox}>
          <Text style={styles.sectionHeader}>Quick Wallet Recharge</Text>
          <Text style={styles.sectionSubtitle}>Select amount or enter custom figure below</Text>

          {/* Preset Chips */}
          <View style={styles.presetsGrid}>
            {RECHARGE_PRESETS.map((amount) => {
              const isSelected = selectedPreset === amount && !customAmount;
              return (
                <TouchableOpacity
                  key={amount}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedPreset(amount);
                    setCustomAmount('');
                  }}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                >
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                    +₹{amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Input */}
          <InputField
            label="Or Enter Custom Amount (₹)"
            placeholder="e.g. 750"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text.replace(/[^0-9]/g, ''));
            }}
            leftIcon={<CreditCard size={18} color={colors.textLight} />}
            containerStyle={styles.customInputContainer}
          />

          <PrimaryButton
            title={`Proceed to Add ₹${Number.isNaN(finalAmount) ? 0 : finalAmount}`}
            onPress={() => setModalVisible(true)}
            style={styles.rechargeSubmitBtn}
          />

          <View style={styles.trustBadge}>
            <ShieldCheck size={16} color={colors.success} />
            <Text style={styles.trustText}>
              100% Secure Payments • Instant Reflection • Full refund on cancellations
            </Text>
          </View>
        </View>

        {/* Transaction History Section */}
        <View style={styles.transactionsHeader}>
          <View style={styles.historyTitleRow}>
            <History size={18} color={colors.text} />
            <Text style={styles.transactionsTitle}>Transaction History</Text>
          </View>
          <Text style={styles.transactionCount}>{transactions.length} items</Text>
        </View>

        {loadingTransactions ? (
          <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
            <LoadingSkeleton width="100%" height={60} borderRadius={8} />
            <LoadingSkeleton width="100%" height={60} borderRadius={8} />
            <LoadingSkeleton width="100%" height={60} borderRadius={8} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyTransactionsText}>
              No transactions recorded yet. Add money above to get started!
            </Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {transactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Confirmation / Payment Mock Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Wallet Recharge</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSummary}>
              <Text style={styles.summaryLabel}>Recharge Amount</Text>
              <Text style={styles.summaryAmount}>₹{finalAmount}</Text>
              <Text style={styles.summaryNote}>
                This is a simulated sandbox transaction. Your wallet balance will be updated
                instantly.
              </Text>
            </View>

            <PrimaryButton
              title={`Confirm & Pay ₹${finalAmount}`}
              onPress={handleRechargeSubmit}
              loading={rechargeMutation.isPending}
              style={styles.modalPayBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Success Modal */}
      <Modal
        visible={paymentSuccessModal}
        animationType="fade"
        transparent
        onRequestClose={() => setPaymentSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <CheckCircle2 size={56} color={colors.success} style={{ marginBottom: spacing.md }} />
            <Text style={styles.modalTitle}>Payment Successful!</Text>
            <Text style={styles.successDesc}>
              ₹{finalAmount} has been credited to your consultation wallet balance.
            </Text>
            <PrimaryButton
              title="Done"
              onPress={() => setPaymentSuccessModal(false)}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  rechargeBox: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  presetChipTextActive: {
    color: colors.white,
  },
  customInputContainer: {
    marginBottom: spacing.sm,
  },
  rechargeSubmitBtn: {
    marginTop: spacing.xs,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  trustText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  transactionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  transactionList: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  emptyTransactions: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSummary: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 4,
  },
  summaryNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  modalPayBtn: {
    width: '100%',
  },
  successDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
