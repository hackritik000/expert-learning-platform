import { API_ROUTES, type Booking, type Educator, type Subject, type Wallet } from '@expert/shared';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowRight, Video } from 'lucide-react-native';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EducatorCard } from '../../components/ui/EducatorCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { SearchBar } from '../../components/ui/SearchBar';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SubjectCard } from '../../components/ui/SubjectCard';
import { WalletBalanceCard } from '../../components/ui/WalletBalanceCard';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useFilterStore } from '../../stores/filterStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { search, setSearch, setSubject } = useFilterStore();

  // Queries
  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Wallet }>(API_ROUTES.WALLET.GET);
      return res.data.data;
    },
  });

  const {
    data: subjectsData,
    isLoading: loadingSubjects,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Subject[] }>(
        API_ROUTES.SUBJECTS.LIST,
      );
      return res.data.data;
    },
  });

  const {
    data: featuredData,
    isLoading: loadingFeatured,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ['educators', 'featured'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: { educators: Educator[] } }>(
        `${API_ROUTES.EDUCATORS.LIST}?limit=6&sortBy=rating`,
      );
      return res.data.data.educators;
    },
  });

  const {
    data: onlineData,
    isLoading: loadingOnline,
    refetch: refetchOnline,
  } = useQuery({
    queryKey: ['educators', 'online'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: { educators: Educator[] } }>(
        `${API_ROUTES.EDUCATORS.LIST}?isOnline=true&limit=6`,
      );
      return res.data.data.educators;
    },
  });

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Booking[] }>(
        API_ROUTES.BOOKINGS.LIST,
      );
      return res.data.data;
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchWallet(),
      refetchSubjects(),
      refetchFeatured(),
      refetchOnline(),
      refetchBookings(),
    ]);
    setRefreshing(false);
  };

  const upcomingBooking = bookingsData?.find((b) => b.status === 'confirmed');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSubjectSelect = (sub: Subject) => {
    setSubject(sub.id, sub.name);
    router.push('/(tabs)/explore');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>
            {user?.name?.trim().split(' ').slice(0, -1).join(' ') || 'Scholar'} 👋
          </Text>
        </View>
        <WalletBalanceCard
          compact
          balance={walletData?.balance ?? 0}
          onRechargePress={() => router.push('/(tabs)/wallet')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          onFilterPress={() => router.push('/(tabs)/explore')}
        />

        {/* Upcoming Consultation Banner if exists */}
        {upcomingBooking && (
          <View style={styles.upcomingBox}>
            <View style={styles.upcomingHeader}>
              <View style={styles.upcomingBadge}>
                <Video size={13} color={colors.white} />
                <Text style={styles.upcomingBadgeText}>Upcoming Consultation</Text>
              </View>
              <Text style={styles.upcomingTime}>
                {upcomingBooking.date} • {upcomingBooking.startTime}
              </Text>
            </View>
            <Text style={styles.upcomingEducator}>Session with {upcomingBooking.educatorName}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/bookings')}
              style={styles.upcomingAction}
            >
              <Text style={styles.upcomingActionText}>View Booking Details</Text>
              <ArrowRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Subjects Horizontal Scroll */}
        <SectionHeader
          title="Explore Subjects"
          subtitle="Choose from top academic & skill categories"
          actionText="See All"
          onAction={() => router.push('/(tabs)/explore')}
        />
        {loadingSubjects ? (
          <View style={styles.horizontalLoading}>
            <LoadingSkeleton width={120} height={40} borderRadius={20} />
            <LoadingSkeleton width={140} height={40} borderRadius={20} />
            <LoadingSkeleton width={110} height={40} borderRadius={20} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {subjectsData?.map((sub) => (
              <SubjectCard key={sub.id} subject={sub} onPress={() => handleSubjectSelect(sub)} />
            ))}
          </ScrollView>
        )}

        {/* Online Mentors */}
        <SectionHeader
          title="Online Mentors Available Now"
          subtitle="Instant 1-on-1 consultations available right now"
          actionText="View Online"
          onAction={() => {
            router.push('/(tabs)/explore');
          }}
        />
        {loadingOnline ? (
          <View style={styles.horizontalLoading}>
            <LoadingSkeleton width={200} height={180} borderRadius={16} />
            <LoadingSkeleton width={200} height={180} borderRadius={16} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {onlineData?.map((ed) => (
              <EducatorCard
                key={ed.id}
                educator={ed}
                horizontal
                onPress={() => router.push(`/educator/${ed.id}`)}
              />
            ))}
          </ScrollView>
        )}

        {/* Featured Educators */}
        <SectionHeader
          title="Top Rated Experts"
          subtitle="Highest ranked mentors verified by students"
          actionText="View All"
          onAction={() => router.push('/(tabs)/explore')}
        />
        {loadingFeatured ? (
          <View style={styles.verticalLoading}>
            <LoadingSkeleton width="100%" height={140} borderRadius={16} />
            <LoadingSkeleton width="100%" height={140} borderRadius={16} />
          </View>
        ) : (
          <View>
            {featuredData?.map((ed) => (
              <EducatorCard
                key={ed.id}
                educator={ed}
                onPress={() => router.push(`/educator/${ed.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  horizontalLoading: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  verticalLoading: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  upcomingBox: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    ...shadows.sm,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    gap: 4,
  },
  upcomingBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  upcomingTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  upcomingEducator: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  upcomingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
