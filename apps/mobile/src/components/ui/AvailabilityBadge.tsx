import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface AvailabilityBadgeProps {
  isOnline: boolean;
  showText?: boolean;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  isOnline,
  showText = true,
}) => {
  return (
    <View style={[styles.badge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
      <View style={[styles.dot, isOnline ? styles.onlineDot : styles.offlineDot]} />
      {showText && (
        <Text style={[styles.text, isOnline ? styles.onlineText : styles.offlineText]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 5,
  },
  onlineBadge: {
    backgroundColor: '#DCFCE7',
  },
  offlineBadge: {
    backgroundColor: '#F1F5F9',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: colors.online,
  },
  offlineDot: {
    backgroundColor: colors.offline,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  onlineText: {
    color: '#15803D',
  },
  offlineText: {
    color: colors.textMuted,
  },
});
