import type { Subject } from '@repo/shared';
import { X } from 'lucide-react-native';
import type React from 'react';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
  selectedSubjectId?: string;
  selectedSortBy: 'rating' | 'price_asc' | 'price_desc' | 'experience';
  selectedMinRating?: number;
  selectedOnlineOnly?: boolean;
  onApply: (filters: {
    subjectId?: string;
    sortBy: 'rating' | 'price_asc' | 'price_desc' | 'experience';
    minRating?: number;
    isOnline?: boolean;
  }) => void;
  onReset: () => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  subjects,
  selectedSubjectId,
  selectedSortBy,
  selectedMinRating,
  selectedOnlineOnly,
  onApply,
  onReset,
}) => {
  const [subjectId, setSubjectId] = useState<string | undefined>(selectedSubjectId);
  const [sortBy, setSortBy] = useState(selectedSortBy);
  const [minRating, setMinRating] = useState<number | undefined>(selectedMinRating);
  const [isOnline, setIsOnline] = useState<boolean | undefined>(selectedOnlineOnly);

  const handleApply = () => {
    onApply({
      subjectId,
      sortBy,
      minRating,
      isOnline,
    });
    onClose();
  };

  const handleReset = () => {
    setSubjectId(undefined);
    setSortBy('rating');
    setMinRating(undefined);
    setIsOnline(undefined);
    onReset();
    onClose();
  };

  const sortOptions = [
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Most Experienced', value: 'experience' },
  ] as const;

  const ratingOptions = [4.5, 4.0, 3.5];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView edges={['bottom']} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Sort Options */}
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.chipGrid}>
              {sortOptions.map((opt) => {
                const isSelected = sortBy === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    onPress={() => setSortBy(opt.value)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Availability */}
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.chipGrid}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsOnline(isOnline ? undefined : true)}
                style={[styles.chip, isOnline && styles.chipActive]}
              >
                <Text style={[styles.chipText, isOnline && styles.chipTextActive]}>
                  Online Now 🟢
                </Text>
              </TouchableOpacity>
            </View>

            {/* Minimum Rating */}
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.chipGrid}>
              {ratingOptions.map((r) => {
                const isSelected = minRating === r;
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.7}
                    onPress={() => setMinRating(isSelected ? undefined : r)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      ★ {r}+
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subject Filters */}
            <Text style={styles.sectionTitle}>Subject Expertise</Text>
            <View style={styles.chipGrid}>
              {subjects.map((sub) => {
                const isSelected = subjectId === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    activeOpacity={0.7}
                    onPress={() => setSubjectId(isSelected ? undefined : sub.id)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <SecondaryButton title="Reset" onPress={handleReset} style={styles.footerBtn} />
            <PrimaryButton title="Apply Filters" onPress={handleApply} style={styles.footerBtn} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollBody: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs + 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerBtn: {
    flex: 1,
  },
});
