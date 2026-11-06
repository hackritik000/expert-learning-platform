import type { Educator, TimeSlot } from '@expert/shared';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Award,
  BadgeCheck,
  Calendar,
  Clock,
  GraduationCap,
  Languages,
  MessageSquare,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilityBadge } from '../../components/ui/AvailabilityBadge';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { apiClient } from '../../services/api';

export default function EducatorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const {
    data: educator,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['educator', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Educator }>(`/api/educators/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  const availableSlots = educator?.availableSlots || [];

  const handleBookNow = () => {
    if (!selectedSlot) return;
    router.push({
      pathname: '/booking/[id]',
      params: {
        id: selectedSlot.id,
        educatorId: educator?.id,
        educatorName: educator?.name,
        educatorAvatar: educator?.avatarUrl,
        educatorTitle: educator?.title,
        hourlyRate: educator?.hourlyRate,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSkeleton width="100%" height={200} borderRadius={16} />
        <LoadingSkeleton width="100%" height={120} borderRadius={16} />
        <LoadingSkeleton width="100%" height={160} borderRadius={16} />
      </View>
    );
  }

  if (isError || !educator) {
    return <ErrorState message="Could not find educator details" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetch();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Image
              source={{ uri: educator.avatarUrl }}
              style={styles.heroAvatar}
              contentFit="cover"
            />
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{educator.name}</Text>
                {educator.isVerified && <BadgeCheck size={18} color={colors.primary} />}
              </View>
              <Text style={styles.heroTitle}>{educator.title}</Text>
              <View style={styles.badgeRow}>
                <AvailabilityBadge isOnline={educator.isOnline} />
                <View style={styles.tag}>
                  <Award size={12} color={colors.primary} />
                  <Text style={styles.tagText}>{educator.experienceYears} Years Exp</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>★ {educator.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{educator.reviewCount} Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>₹{educator.hourlyRate}</Text>
              <Text style={styles.statLabel}>Per Session</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <TouchableOpacity
                onPress={() => router.push(`/chat/${educator.id}`)}
                style={styles.chatIconBtn}
              >
                <MessageSquare size={16} color={colors.primary} />
                <Text style={styles.chatIconText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Subjects & Skills */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Subjects & Specializations</Text>
          <View style={styles.chipsWrapper}>
            {educator.subjects?.map((sub) => (
              <View key={sub.id} style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{sub.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Professional Biography */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>About Mentor</Text>
          <Text style={styles.bioText}>{educator.bio}</Text>
        </View>

        {/* Education & Languages */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Credentials & Languages</Text>
          <View style={styles.detailRow}>
            <GraduationCap size={18} color={colors.textLight} />
            <Text style={styles.detailText}>{educator.education}</Text>
          </View>
          <View style={styles.detailRow}>
            <Languages size={18} color={colors.textLight} />
            <Text style={styles.detailText}>
              Fluent in {educator.languages?.join(', ') || 'English'}
            </Text>
          </View>
        </View>

        {/* Available Consultation Slots */}
        <View style={styles.sectionCard}>
          <View style={styles.slotHeaderRow}>
            <Text style={styles.sectionHeading}>Select Available Time Slot</Text>
            <Text style={styles.slotSubtitle}>{availableSlots.length} slots open</Text>
          </View>

          {availableSlots.length === 0 ? (
            <Text style={styles.noSlotsText}>
              No available slots open right now. Please check back later.
            </Text>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                  >
                    <View style={styles.slotDateRow}>
                      <Calendar size={13} color={isSelected ? colors.white : colors.textMuted} />
                      <Text style={[styles.slotDateText, isSelected && styles.slotTextSelected]}>
                        {slot.date}
                      </Text>
                    </View>
                    <View style={styles.slotTimeRow}>
                      <Clock size={13} color={isSelected ? colors.white : colors.primary} />
                      <Text style={[styles.slotTimeText, isSelected && styles.slotTextSelected]}>
                        {slot.startTime}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Student Reviews */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Verified Student Reviews</Text>
          {educator.reviews?.length === 0 ? (
            <Text style={styles.noSlotsText}>No reviews yet.</Text>
          ) : (
            educator.reviews?.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{rev.studentName}</Text>
                  <View style={styles.reviewRating}>
                    <Star size={12} color={colors.warning} fill={colors.warning} />
                    <Text style={styles.reviewRatingText}>{rev.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarPriceLabel}>Consultation Fee</Text>
          <Text style={styles.bottomBarPrice}>₹{educator.hourlyRate}</Text>
        </View>
        <PrimaryButton
          title={selectedSlot ? 'Book Selected Slot' : 'Select a Slot Above'}
          onPress={handleBookNow}
          disabled={!selectedSlot}
          style={styles.bookButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.borderLight,
    marginRight: spacing.md,
  },
  heroInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  heroTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  chatIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  chatIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  bioText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.text,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotSubtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  noSlotsText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '48%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  slotCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  slotDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  slotTextSelected: {
    color: colors.white,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  bottomBarPriceLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bottomBarPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  bookButton: {
    minWidth: 180,
  },
});
