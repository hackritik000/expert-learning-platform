import { API_ROUTES, type Booking } from '@repo/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingCard } from '../../components/ui/BookingCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { colors, radius, spacing } from '../../constants/theme';
import { queryClient } from '../../lib/queryClient';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type FilterTab = 'all' | 'confirmed' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const isEducator = user?.role === 'educator';
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Booking[] }>(
        API_ROUTES.BOOKINGS.LIST,
      );
      return res.data.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient.patch(API_ROUTES.BOOKINGS.CANCEL(bookingId), {
        reason: isEducator ? 'Educator cancelled consultation' : 'Student cancelled consultation',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['educatorEarnings'] });
      Alert.alert(
        'Consultation Cancelled',
        isEducator
          ? 'The session has been cancelled and fee refunded to the student.'
          : 'Your fee has been fully refunded to your wallet.',
      );
    },
    onError: (err: any) => {
      Alert.alert('Cancellation Error', err.message || 'Failed to cancel consultation');
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiClient.patch(API_ROUTES.BOOKINGS.COMPLETE(bookingId));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['educatorEarnings'] });
      Alert.alert('Consultation Completed', 'Session marked as completed successfully!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to complete consultation');
    },
  });

  const handleCancel = (booking: Booking) => {
    const counterparty = isEducator ? booking.studentName || 'the student' : booking.educatorName;
    Alert.alert(
      'Cancel Consultation',
      `Are you sure you want to cancel the session with ${counterparty}? ₹${booking.amount} will be refunded to the student's wallet.`,
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

  const handleComplete = (booking: Booking) => {
    Alert.alert(
      'Complete Session',
      `Mark consultation with ${booking.studentName || 'student'} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: () => completeMutation.mutate(booking.id),
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
        <Text style={styles.title}>{isEducator ? 'Educator Bookings' : 'My Consultations'}</Text>
        <Text style={styles.subtitle}>
          {isEducator
            ? 'Track sessions booked by students and student consultations'
            : 'Track upcoming 1-on-1 sessions, chats, and previous consultations'}
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
              ? isEducator
                ? 'You do not have any student bookings yet.'
                : 'You have not booked any consultations yet. Explore top educators to schedule your first session!'
              : `You have no ${activeTab} consultations at the moment.`
          }
          actionTitle={isEducator ? 'Manage Slots' : 'Explore Experts'}
          onAction={() => router.push(isEducator ? '/educator/manage-slots' : '/explore')}
          icon={<Calendar size={32} color={colors.primary} />}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              isEducator={isEducator}
              onChatPress={() =>
                router.push(
                  isEducator
                    ? `/chat/${item.id}` // chat screen handles room navigation
                    : `/chat/${item.educatorId}`,
                )
              }
              onCancelPress={() => handleCancel(item)}
              onCompletePress={() => handleComplete(item)}
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
