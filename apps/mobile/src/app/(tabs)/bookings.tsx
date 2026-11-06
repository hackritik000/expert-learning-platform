import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar } from 'lucide-react-native';
import type { Booking } from '@expert/shared';
import { apiClient } from '../../services/api';
import { queryClient } from '../../lib/queryClient';
import { colors, radius, spacing } from '../../constants/theme';
import { BookingCard } from '../../components/ui/BookingCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

type FilterTab = 'all' | 'confirmed' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Booking[] }>('/api/bookings');
      return res.data.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient.patch(`/api/bookings/${bookingId}/cancel`, {
        reason: 'Student cancelled consultation',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      Alert.alert('Consultation Cancelled', 'Your fee has been fully refunded to your wallet.');
    },
    onError: (err: any) => {
      Alert.alert('Cancellation Error', err.message || 'Failed to cancel consultation');
    },
  });

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancel Consultation',
      `Are you sure you want to cancel your session with ${booking.educatorName}? ₹${booking.amount} will be refunded to your wallet.`,
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(booking.id),
        },
      ],
    );
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Consultations</Text>
        <Text style={styles.subtitle}>
          Track upcoming 1-on-1 sessions, chats, and previous consultations
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton width="100%" height={160} borderRadius={16} />
          <LoadingSkeleton width="100%" height={160} borderRadius={16} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="No Consultations Found"
          description={
            activeTab === 'all'
              ? 'You have not booked any consultations yet. Explore top educators to schedule your first session!'
              : `You have no ${activeTab} consultations at the moment.`
          }
          actionTitle="Explore Experts"
          onAction={() => router.push('/(tabs)/explore')}
          icon={<Calendar size={32} color={colors.primary} />}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onChatPress={() => router.push(`/chat/${item.educatorId}`)}
              onCancelPress={() => handleCancel(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                refetch();
              }}
              colors={[colors.primary]}
            />
          }
        />
      )}
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
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabItem: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xs,
  },
});
