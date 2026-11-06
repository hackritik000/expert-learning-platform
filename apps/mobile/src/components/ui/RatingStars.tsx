import type React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
  showScore?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 14,
  showScore = true,
}) => {
  return (
    <View style={styles.container}>
      <Star size={size} color={colors.warning} fill={colors.warning} />
      {showScore && <Text style={styles.score}>{rating.toFixed(1)}</Text>}
      {count !== undefined && <Text style={styles.count}>({count})</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
