import { API_ROUTES, type Educator, type Subject } from '@repo/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBottomSheet } from '../components/modals/FilterBottomSheet';
import { EducatorCard } from '../components/ui/EducatorCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { SearchBar } from '../components/ui/SearchBar';
import { colors, radius, spacing } from '../constants/theme';
import { apiClient } from '../services/api';
import { useFilterStore } from '../stores/filterStore';

interface EducatorsApiResponse {
  educators: Educator[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    search,
    setSearch,
    subjectId,
    subjectName,
    setSubject,
    minPrice,
    maxPrice,
    minRating,
    setMinRating,
    isOnline,
    setIsOnline,
    sortBy,
    setSortBy,
    resetFilters,
  } = useFilterStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search query 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch subjects for filters
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Subject[] }>(
        API_ROUTES.SUBJECTS.LIST,
      );
      return res.data.data;
    },
  });

  // Fetch educators with active filters using infinite query for pagination
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'educators',
      debouncedSearch,
      subjectId,
      minPrice,
      maxPrice,
      minRating,
      isOnline,
      sortBy,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append('page', String(pageParam));
      params.append('limit', String(PAGE_SIZE));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (subjectId) params.append('subjectId', subjectId);
      if (minPrice !== undefined) params.append('minPrice', String(minPrice));
      if (maxPrice !== undefined) params.append('maxPrice', String(maxPrice));
      if (minRating !== undefined) params.append('minRating', String(minRating));
      if (isOnline !== undefined) params.append('isOnline', String(isOnline));
      if (sortBy) params.append('sortBy', sortBy);

      const queryString = params.toString();
      const endpoint = `${API_ROUTES.EDUCATORS.LIST}?${queryString}`;
      const res = await apiClient.get<{
        success: boolean;
        data: EducatorsApiResponse;
      }>(endpoint);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  const educators = useMemo(() => {
    return data?.pages.flatMap((page) => page.educators) ?? [];
  }, [data]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const hasActiveFilters = Boolean(
    subjectId || minPrice || maxPrice || minRating || isOnline || sortBy !== 'rating',
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Find Your Mentor</Text>
        <Text style={styles.screenSubtitle}>
          Connect 1-on-1 with vetted industry specialists & professors
        </Text>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        onFilterPress={() => setFilterModalVisible(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersRow}>
          {subjectName && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{subjectName}</Text>
              <TouchableOpacity onPress={() => setSubject(undefined, undefined)}>
                <X size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {isOnline && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>Online Now</Text>
              <TouchableOpacity onPress={() => setIsOnline(undefined)}>
                <X size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {minRating && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>★ {minRating}+</Text>
              <TouchableOpacity onPress={() => setMinRating(undefined)}>
                <X size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={resetFilters} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Educator List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSkeleton width="100%" height={150} borderRadius={16} />
          <LoadingSkeleton width="100%" height={150} borderRadius={16} />
          <LoadingSkeleton width="100%" height={150} borderRadius={16} />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : educators.length === 0 ? (
        <EmptyState
          title="No Mentors Found"
          description="Try loosening your filters or searching for another keyword or subject."
          actionTitle="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <FlatList
          data={educators}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <EducatorCard educator={item} onPress={() => router.push(`/educator/${item.id}`)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.footerLoaderText}>Loading more mentors...</Text>
              </View>
            ) : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => {
                refetch();
              }}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        subjects={subjects}
        selectedSubjectId={subjectId}
        selectedSortBy={sortBy}
        selectedMinRating={minRating}
        selectedOnlineOnly={isOnline}
        onApply={(filters) => {
          const selectedSub = subjects.find((s) => s.id === filters.subjectId);
          setSubject(filters.subjectId, selectedSub?.name);
          setSortBy(filters.sortBy);
          setMinRating(filters.minRating);
          setIsOnline(filters.isOnline);
        }}
        onReset={resetFilters}
      />
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
    marginBottom: spacing.xs,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 4,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  loadingContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerLoaderText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
