import type React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Calendar, Clock, MessageSquare, Ban } from 'lucide-react-native';
import type { Booking } from '@expert/shared';
import { colors, radius, shadows, spacing } from '../../constants/theme';

interface BookingCardProps {
  booking: Booking;
  onChatPress?: () => void;
  onCancelPress?: () => void;
  onPress?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onChatPress,
  onCancelPress,
  onPress,
}) => {
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';

  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed':
        return { bg: colors.successLight, text: colors.success };
      case 'cancelled':
        return { bg: colors.errorLight, text: colors.error };
      case 'completed':
        return { bg: colors.secondary, text: colors.primary };
      default:
        return { bg: colors.warningLight, text: colors.warning };
    }
  };

  const statusStyle = getStatusColor();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Image source={{ uri: booking.educatorAvatar }} style={styles.avatar} contentFit="cover" />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {booking.educatorName}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {booking.educatorTitle}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.slotRow}>
        <View style={styles.slotItem}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={styles.slotText}>{booking.date}</Text>
        </View>
        <View style={styles.slotItem}>
          <Clock size={14} color={colors.textMuted} />
          <Text style={styles.slotText}>
            {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <Text style={styles.price}>₹{booking.amount}</Text>
      </View>

      {booking.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          Note: {booking.notes}
        </Text>
      ) : null}

      {!isCancelled && !isCompleted && (
        <View style={styles.actionRow}>
          {onChatPress && (
            <TouchableOpacity activeOpacity={0.8} onPress={onChatPress} style={styles.chatBtn}>
              <MessageSquare size={15} color={colors.white} />
              <Text style={styles.chatBtnText}>Chat with Expert</Text>
            </TouchableOpacity>
          )}

          {onCancelPress && (
            <TouchableOpacity activeOpacity={0.8} onPress={onCancelPress} style={styles.cancelBtn}>
              <Ban size={15} color={colors.error} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
    marginRight: spacing.sm + 4,
  },
  headerInfo: {
    flex: 1,
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
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  price: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  notes: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.sm,
    gap: 6,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
});
