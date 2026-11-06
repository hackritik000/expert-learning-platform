import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../constants/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  hasActiveFilters?: boolean;
}

export const SearchBar = React.forwardRef<React.ComponentRef<typeof TextInput>, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      onClear,
      onFilterPress,
      placeholder = 'Search educators, subjects, skills...',
      hasActiveFilters = false,
    },
    ref,
  ) => {
    return (
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textLight} />
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            style={styles.input}
            returnKeyType="search"
          />
          {value.length > 0 && onClear && (
            <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {onFilterPress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onFilterPress}
            style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          >
            <SlidersHorizontal size={18} color={hasActiveFilters ? colors.white : colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryDark,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
