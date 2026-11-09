import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
}

export function SearchTrigger({ placeholder = 'Search educators, subjects...' }: SearchBarProps) {
  const router = useRouter();

  return (
    <View style={styles.main}>
      <Pressable
        onPress={() => router.push('/explore')}
        accessibilityRole="button"
        accessibilityLabel="Open search"
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        <View style={styles.content}>
          <Ionicons name="search-outline" size={21} color={colors.textMuted} />

          <Text style={styles.placeholder} numberOfLines={1}>
            {placeholder}
          </Text>
        </View>

        <Ionicons name="options-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    paddingInline: 12,
    paddingBlock: 4,
  },
  container: {
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeholder: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: colors.surfaceMuted,
  },
});
