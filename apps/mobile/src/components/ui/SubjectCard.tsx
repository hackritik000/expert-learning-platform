import type React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Calculator,
  Code,
  Atom,
  MessageSquare,
  TrendingUp,
  FlaskConical,
  Palette,
  BookOpen,
} from 'lucide-react-native';
import type { Subject } from '@expert/shared';
import { colors, radius, shadows, spacing } from '../../constants/theme';

interface SubjectCardProps {
  subject: Subject;
  isSelected?: boolean;
  onPress: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  isSelected = false,
  onPress,
}) => {
  const renderIcon = () => {
    const iconColor = isSelected ? colors.white : colors.primary;
    const size = 20;

    switch (subject.iconName) {
      case 'Calculator':
        return <Calculator size={size} color={iconColor} />;
      case 'Code':
        return <Code size={size} color={iconColor} />;
      case 'Atom':
        return <Atom size={size} color={iconColor} />;
      case 'MessageSquare':
        return <MessageSquare size={size} color={iconColor} />;
      case 'TrendingUp':
        return <TrendingUp size={size} color={iconColor} />;
      case 'FlaskConical':
        return <FlaskConical size={size} color={iconColor} />;
      case 'Palette':
        return <Palette size={size} color={iconColor} />;
      default:
        return <BookOpen size={size} color={iconColor} />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, isSelected && styles.cardSelected]}
    >
      {renderIcon()}
      <Text style={[styles.title, isSelected && styles.titleSelected]} numberOfLines={1}>
        {subject.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    gap: 8,
    ...shadows.sm,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  titleSelected: {
    color: colors.white,
  },
});
