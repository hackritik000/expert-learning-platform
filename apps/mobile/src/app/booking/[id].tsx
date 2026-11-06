import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  Calendar,
  Clock,
  Wallet as WalletIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import { API_ROUTES, type Wallet } from '@expert/shared';
import { apiClient } from '../../services/api';
import { queryClient } from '../../lib/queryClient';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { InputField } from '../../components/ui/InputField';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string; // slotId
    educatorId: string;
    educatorName: string;
    educatorAvatar: string;
    educatorTitle: string;
    hourlyRate: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();

  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  const price = Number.parseInt(params.hourlyRate || '500', 10);

  // Fetch current user wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Wallet }>(API_ROUTES.WALLET.GET);
      return res.data.data;
    },
  });

  const walletBalance = wallet?.balance ?? 0;
  const hasSufficientBalance = walletBalance >= price;

  // Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(API_ROUTES.BOOKINGS.CREATE, {
        educatorId: params.educatorId,
        slotId: params.id,
        notes: notes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['educator', params.educatorId] });
      setBookingSuccess(data.data);
    },
    onError: (err: any) => {
      Alert.alert('Booking Error', err.message || 'Failed to complete booking');
    },
  });

  if (bookingSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle2 size={64} color={colors.success} style={{ marginBottom: spacing.md }} />
          <Text style={styles.successTitle}>Consultation Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your 1-on-1 session with {params.educatorName} is confirmed for {params.date} at{' '}
            {params.startTime}.
          </Text>

          <View style={styles.successDetailsBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Deducted</Text>
              <Text style={styles.summaryValue}>₹{price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Updated Wallet Balance</Text>
              <Text style={styles.summaryValue}>
                ₹{(walletBalance - price).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="Start Chat with Expert"
            onPress={() => {
              router.dismiss();
              router.push(`/chat/${params.educatorId}`);
            }}
            style={{ width: '100%', marginBottom: spacing.sm }}
          />

          <SecondaryButton
            title="View All My Bookings"
            onPress={() => {
              router.dismiss();
              router.push('/(tabs)/bookings');
            }}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.educatorHeader}>
        <Image source={{ uri: params.educatorAvatar }} style={styles.avatar} contentFit="cover" />
        <View style={styles.educatorInfo}>
          <Text style={styles.educatorName}>{params.educatorName}</Text>
          <Text style={styles.educatorTitle}>{params.educatorTitle}</Text>
        </View>
      </View>

      {/* Selected Slot Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardHeader}>Selected Session Time</Text>
        <View style={styles.infoRow}>
          <Calendar size={18} color={colors.primary} />
          <Text style={styles.infoText}>{params.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            {params.startTime} - {params.endTime}
          </Text>
        </View>
      </View>

      {/* Wallet Balance Verification */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletLabelGroup}>
            <WalletIcon size={18} color={colors.primary} />
            <Text style={styles.walletLabel}>Your Wallet Balance</Text>
          </View>
          <Text style={styles.walletBalance}>₹{walletBalance.toLocaleString('en-IN')}</Text>
        </View>

        {!hasSufficientBalance && (
          <View style={styles.warningBox}>
            <AlertTriangle size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Insufficient Balance</Text>
              <Text style={styles.warningText}>
                You need ₹{price - walletBalance} more to confirm this consultation.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  router.dismiss();
                  router.push('/(tabs)/wallet');
                }}
                style={styles.rechargeLink}
              >
                <Text style={styles.rechargeLinkText}>Recharge Wallet Now</Text>
                <ArrowRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Session Notes */}
      <View style={styles.notesCard}>
        <InputField
          label="Preparation Notes for Mentor (Optional)"
          placeholder="e.g. Topics you wish to cover, doubts, or specific questions..."
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          style={{ height: 75, textAlignVertical: 'top', paddingTop: 8 }}
        />
      </View>

      {/* Price Summary */}
      <View style={styles.priceSummaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Consultation Rate</Text>
          <Text style={styles.summaryValue}>₹{price}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Platform Booking Fee</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>FREE (₹0)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>₹{price}</Text>
        </View>
      </View>

      <PrimaryButton
        title={hasSufficientBalance ? `Confirm & Pay ₹${price}` : 'Add Money to Wallet'}
        onPress={() => {
          if (hasSufficientBalance) {
            bookingMutation.mutate();
          } else {
            router.dismiss();
            router.push('/(tabs)/wallet');
          }
        }}
        loading={bookingMutation.isPending}
        style={styles.confirmBtn}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    backgroundColor: colors.background,
    paddingBottom: spacing.xxl,
  },
  educatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: colors.borderLight,
  },
  educatorInfo: {
    flex: 1,
  },
  educatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  educatorTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  walletCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
  },
  rechargeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  rechargeLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  notesCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  priceSummaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs + 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  confirmBtn: {
    marginBottom: spacing.lg,
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  successCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
});
