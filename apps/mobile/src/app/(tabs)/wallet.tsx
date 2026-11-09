import {
  API_ROUTES,
  type EducatorEarningsSummary,
  RECHARGE_PRESETS,
  type Wallet,
  type WalletTransaction,
} from '@repo/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  History,
  Landmark,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/ui/InputField';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TransactionItem } from '../../components/ui/TransactionItem';
import { WalletBalanceCard } from '../../components/ui/WalletBalanceCard';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { queryClient } from '../../lib/queryClient';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isEducator = user?.role === 'educator';

  // Student recharge state
  const [selectedPreset, setSelectedPreset] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);

  // Educator withdraw state
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawSuccessModal, setWithdrawSuccessModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAccount, setWithdrawAccount] = useState<string>('');
  const [withdrawnAmountDisplay, setWithdrawnAmountDisplay] = useState<number>(0);

  // Educator Earnings Summary
  const {
    data: earningsSummary,
    isLoading: loadingEarnings,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ['educatorEarnings'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: EducatorEarningsSummary }>(
        API_ROUTES.BOOKINGS.EDUCATOR_EARNINGS,
      );
      return res.data.data;
    },
    enabled: isEducator,
  });

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

  // Recharge Mutation (Students only)
  const rechargeMutation = useMutation({
    mutationFn: async (amount: number) => {
      console.log('recharge started');
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
      Alert.alert(
        'Recharge Failed',
        err.response?.data?.error || err.message || 'Unable to complete payment',
      );
    },
  });

  // Withdraw Mutation (Educators)
  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, accountDetails }: { amount: number; accountDetails: string }) => {
      const res = await apiClient.post(API_ROUTES.WALLET.WITHDRAW, {
        amount,
        accountDetails: accountDetails.trim() || 'UPI / Bank Transfer',
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      setWithdrawnAmountDisplay(variables.amount);
      setWithdrawModalVisible(false);
      setWithdrawSuccessModal(true);
      setWithdrawAmount('');
      setWithdrawAccount('');
    },
    onError: (err: any) => {
      Alert.alert(
        'Withdrawal Failed',
        err.response?.data?.error || err.message || 'Unable to process withdrawal',
      );
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

  const handleWithdrawSubmit = () => {
    const amount = Number.parseInt(withdrawAmount, 10);
    if (Number.isNaN(amount) || amount < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is ₹100');
      return;
    }
    const currentBalance = wallet?.balance ?? 0;
    if (amount > currentBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Your available balance is ₹${currentBalance}. You cannot withdraw more than available funds.`,
      );
      return;
    }
    withdrawMutation.mutate({
      amount,
      accountDetails: withdrawAccount,
    });
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    const promises: Promise<unknown>[] = [refetchWallet(), refetchTransactions()];
    if (isEducator) {
      promises.push(refetchEarnings());
    }
    await Promise.all(promises);
    setRefreshing(false);
  };

  const finalAmount = customAmount ? Number.parseInt(customAmount, 10) : selectedPreset;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEducator ? 'Earnings & Payouts' : 'Consultation Wallet'}
        </Text>
        <Text style={styles.subtitle}>
          {isEducator
            ? 'Track your earnings and withdraw consultation payouts to your account'
            : 'Secure pre-paid balance for instant bookings with zero hassle'}
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
        {/* Educator Earnings Overview Cards */}
        {isEducator && (
          <View style={styles.educatorEarningsContainer}>
            <View style={styles.earningsHeroCard}>
              <View style={styles.earningsHeroHeader}>
                <View style={styles.earningsHeroLabelRow}>
                  <TrendingUp size={20} color="#FFFFFF" />
                  <Text style={styles.earningsHeroLabel}>Total Consultation Earnings</Text>
                </View>
                <View style={styles.earningsPill}>
                  <Text style={styles.earningsPillText}>Live</Text>
                </View>
              </View>
              <Text style={styles.earningsHeroAmount}>
                ₹{(earningsSummary?.totalEarnings ?? 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.earningsHeroSub}>
                From {earningsSummary?.totalBookingsCount ?? 0} total consultation sessions
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: colors.successLight }]}>
                  <Award size={18} color={colors.success} />
                </View>
                <Text style={styles.statValue}>{earningsSummary?.completedBookingsCount ?? 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: colors.secondary }]}>
                  <Clock size={18} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{earningsSummary?.confirmedBookingsCount ?? 0}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: colors.errorLight }]}>
                  <X size={18} color={colors.error} />
                </View>
                <Text style={styles.statValue}>{earningsSummary?.cancelledBookingsCount ?? 0}</Text>
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
            </View>
          </View>
        )}

        {/* Wallet Balance Card */}
        {loadingWallet ? (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <LoadingSkeleton width="100%" height={140} borderRadius={16} />
          </View>
        ) : (
          <WalletBalanceCard
            balance={wallet?.balance ?? 0}
            isEducator={isEducator}
            onRechargePress={isEducator ? undefined : () => setModalVisible(true)}
            onWithdrawPress={isEducator ? () => setWithdrawModalVisible(true) : undefined}
          />
        )}

        {/* Educator Withdraw Section */}
        {isEducator ? (
          <View style={styles.rechargeBox}>
            <View style={styles.educatorWithdrawHeader}>
              <View>
                <Text style={styles.sectionHeader}>Payout Withdrawal</Text>
                <Text style={styles.sectionSubtitle}>
                  Transfer earned consultation fees to your account
                </Text>
              </View>
            </View>

            <View style={styles.payoutNoticeBox}>
              <Landmark size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutNoticeTitle}>Direct Payouts</Text>
                <Text style={styles.payoutNoticeSub}>
                  Educators earn money directly from completed bookings. You can withdraw your
                  available balance anytime via UPI or bank account.
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="Request Withdrawal"
              onPress={() => setWithdrawModalVisible(true)}
              style={styles.rechargeSubmitBtn}
            />

            <View style={styles.trustBadge}>
              <ShieldCheck size={16} color={colors.success} />
              <Text style={styles.trustText}>
                Zero commission on payouts • Fast bank transfer • Verified security
              </Text>
            </View>
          </View>
        ) : (
          /* Student Quick Recharge Box */
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
                    <Text
                      style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}
                    >
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
        )}

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
              {isEducator
                ? 'No earnings or withdrawal transactions yet. Complete consultation sessions to earn.'
                : 'No transactions recorded yet. Add money above to get started!'}
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

      {/* Student Recharge Confirmation Modal */}
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

      {/* Student Payment Success Modal */}
      <Modal
        visible={paymentSuccessModal}
        animationType="fade"
        transparent
        onRequestClose={() => setPaymentSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
              <CheckCircle2 size={56} color={colors.success} />
              <Text style={[styles.modalTitle, { marginTop: spacing.md }]}>
                Recharge Successful!
              </Text>
              <Text style={styles.successDesc}>
                ₹{finalAmount} has been credited to your consultation wallet balance.
              </Text>
            </View>

            <PrimaryButton
              title="Done"
              onPress={() => {
                setPaymentSuccessModal(false);
                setCustomAmount('');
              }}
              style={styles.modalPayBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Educator Withdrawal Modal */}
      <Modal
        visible={withdrawModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Earnings</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSummary}>
              <Text style={styles.summaryLabel}>Available for Withdrawal</Text>
              <Text style={styles.summaryAmount}>
                ₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summaryNote}>Minimum withdrawal amount: ₹100</Text>
            </View>

            <InputField
              label="Amount to Withdraw (₹)"
              placeholder="e.g. 500"
              keyboardType="number-pad"
              value={withdrawAmount}
              onChangeText={(text) => setWithdrawAmount(text.replace(/[^0-9]/g, ''))}
              leftIcon={<DollarSign size={18} color={colors.textLight} />}
              containerStyle={styles.customInputContainer}
            />

            <InputField
              label="UPI ID or Bank Account"
              placeholder="e.g. educator@okhdfcbank"
              value={withdrawAccount}
              onChangeText={setWithdrawAccount}
              autoCapitalize="none"
              leftIcon={<Landmark size={18} color={colors.textLight} />}
              containerStyle={styles.customInputContainer}
            />

            <PrimaryButton
              title={withdrawAmount ? `Withdraw ₹${withdrawAmount}` : 'Enter Amount'}
              onPress={handleWithdrawSubmit}
              loading={withdrawMutation.isPending}
              disabled={!withdrawAmount || Number.parseInt(withdrawAmount, 10) < 100}
              style={styles.modalPayBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Educator Withdrawal Success Modal */}
      <Modal
        visible={withdrawSuccessModal}
        animationType="fade"
        transparent
        onRequestClose={() => setWithdrawSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
              <CheckCircle2 size={56} color={colors.success} />
              <Text style={[styles.modalTitle, { marginTop: spacing.md }]}>
                Withdrawal Initiated!
              </Text>
              <Text style={styles.successDesc}>
                ₹{withdrawnAmountDisplay} has been deducted from your wallet balance and sent to
                your account.
              </Text>
            </View>

            <PrimaryButton
              title="Done"
              onPress={() => setWithdrawSuccessModal(false)}
              style={styles.modalPayBtn}
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
  educatorEarningsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  earningsHeroCard: {
    backgroundColor: '#0F766E', // Rich teal gradient-like color
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  earningsHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  earningsHeroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningsHeroLabel: {
    color: '#CCFBF1',
    fontSize: 14,
    fontWeight: '700',
  },
  earningsPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  earningsPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  earningsHeroAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  earningsHeroSub: {
    color: '#99F6E4',
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
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
  educatorWithdrawHeader: {
    marginBottom: spacing.xs,
  },
  payoutNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  payoutNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  payoutNoticeSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
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
