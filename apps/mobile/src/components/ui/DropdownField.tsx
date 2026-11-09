import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: DropdownOption[];
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  onChange: (value: string) => void;
}

export const DropdownField = ({
  label,
  placeholder = 'Select an option',
  value,
  options,
  error,
  disabled = false,
  containerStyle,
  onChange,
}: DropdownFieldProps) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (item: DropdownOption) => {
    onChange(item.value);
    setVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
          disabled ? styles.disabled : null,
        ]}
      >
        <Text numberOfLines={1} style={[styles.input, !selectedOption && styles.placeholder]}>
          {selectedOption?.label || placeholder}
        </Text>

        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.value === value;

                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={[styles.option, isSelected && styles.selectedOption]}
                  >
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {item.label}
                    </Text>

                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No options available</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  placeholder: {
    color: colors.textLight,
  },
  arrow: {
    fontSize: 20,
    color: colors.textLight,
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: `${colors.errorLight}20`,
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  selectedOption: {
    backgroundColor: `${colors.primary}15`,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: colors.primary,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.lg,
    color: colors.textLight,
  },
});
