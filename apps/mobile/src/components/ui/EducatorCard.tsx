import type React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BadgeCheck, Clock, Award } from 'lucide-react-native';
import type { Educator } from '@expert/shared';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { RatingStars } from './RatingStars';
import { AvailabilityBadge } from './AvailabilityBadge';

interface EducatorCardProps {
  educator: Educator;
  onPress: () => void;
  horizontal?: boolean;
}

export const EducatorCard: React.FC<EducatorCardProps> = ({
  educator,
  onPress,
  horizontal = false,
}) => {
  const subjectName = educator.subjects?.[0]?.name || 'Expert Mentor';

  if (horizontal) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.horizontalCard}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: educator.avatarUrl }}
            style={styles.horizontalImage}
            contentFit="cover"
          />
          <View style={styles.onlineBadgeAbsolute}>
            <AvailabilityBadge isOnline={educator.isOnline} showText={false} />
          </View>
        </View>

        <View style={styles.horizontalContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {educator.name}
            </Text>
            {educator.isVerified && <BadgeCheck size={16} color={colors.primary} />}
          </View>
          <Text style={styles.subjectBadge} numberOfLines={1}>
            {subjectName}
          </Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={educator.rating} count={educator.reviewCount} />
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{educator.hourlyRate}</Text>
            <Text style={styles.perSession}>/ session</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: educator.avatarUrl }} style={styles.avatar} contentFit="cover" />
          <View style={styles.onlineBadgeAbsolute}>
            <AvailabilityBadge isOnline={educator.isOnline} showText={false} />
          </View>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {educator.name}
            </Text>
            {educator.isVerified && <BadgeCheck size={16} color={colors.primary} />}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {educator.title}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.tag}>
              <Award size={12} color={colors.primary} />
              <Text style={styles.tagText}>{educator.experienceYears}y exp</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{subjectName}</Text>
            </View>
            <AvailabilityBadge isOnline={educator.isOnline} />
          </View>
        </View>
      </View>

      <Text style={styles.bio} numberOfLines={2}>
        {educator.bio}
      </Text>

      <View style={styles.bottomRow}>
        <RatingStars rating={educator.rating} count={educator.reviewCount} />
        <View style={styles.priceWrapper}>
          <Text style={styles.price}>₹{educator.hourlyRate}</Text>
          <Text style={styles.perSession}>/ session</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: spacing.sm + 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  onlineBadgeAbsolute: {
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  title: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    gap: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  bio: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.sm + 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm + 2,
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  perSession: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 3,
  },
  // Horizontal card styles
  horizontalCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  horizontalImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.xs,
  },
  horizontalContent: {
    marginTop: spacing.xs,
  },
  subjectBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingRow: {
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
});
