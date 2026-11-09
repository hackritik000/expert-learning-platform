import { zodResolver } from '@hookform/resolvers/zod';
import { API_ROUTES } from '@repo/shared';
import { type UpdateUserProfileFormData, updateUserProfileSchema } from '@repo/validation';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User as UserIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImagePicker } from '@/components/images/imagePicker';
import { InputField } from '@/components/ui/InputField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function EditStudentProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<UpdateUserProfileFormData>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateUserProfileFormData) => {
    try {
      setIsSaving(true);

      const payload = {
        name: data.name?.trim(),
        phoneNumber: data.phoneNumber?.trim() || null,
        avatarUrl: data.avatarUrl || '',
      };

      const res = await apiClient.put<{ success: boolean; data: any }>(
        API_ROUTES.AUTH.UPDATE_PROFILE,
        payload,
      );

      const updatedUser = res.data?.data;
      if (updatedUser) {
        await updateUser(updatedUser);
      } else {
        await updateUser({
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.phoneNumber !== undefined ? { phoneNumber: payload.phoneNumber } : {}),
          ...(payload.avatarUrl ? { avatarUrl: payload.avatarUrl } : {}),
        });
      }

      await queryClient.invalidateQueries();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update profile. Please try again.';
      Alert.alert('Update Failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Student Account</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSubmit(onSubmit)()}
          disabled={isSaving}
          style={[styles.headerSaveBtn, isSaving && { opacity: 0.6 }]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.headerSaveInner}>
              <Check size={16} color={colors.primary} />
              <Text style={styles.headerSaveText}>Save</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
      >
        {/* Avatar Card */}
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <Controller
              control={control}
              name="avatarUrl"
              render={({ field: { value, onChange } }) => (
                <ImagePicker
                  value={value}
                  onChange={(uri) => onChange(uri)}
                  folderName="avatars"
                  size={110}
                  shape="circle"
                  placeholder="Upload Photo"
                />
              )}
            />

            <View style={styles.roleBadge}>
              <Shield size={12} color={colors.primary} />
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
            </View>
          </View>
        </View>

        {/* Profile Information Fields */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <UserIcon size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <Text style={styles.cardSubtitle}>Your public information visible to mentors</Text>
            </View>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Full Name *"
                placeholder="e.g. Rohan Sharma"
                value={value}
                onChangeText={onChange}
                error={formErrors.name?.message}
                leftIcon={<UserIcon size={18} color={colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Phone Number"
                placeholder="e.g. +91 9876543210"
                keyboardType="phone-pad"
                value={value || ''}
                onChangeText={onChange}
                error={formErrors.phoneNumber?.message}
                leftIcon={<Phone size={18} color={colors.textLight} />}
              />
            )}
          />

          {/* Email (Read-Only) */}
          <View style={styles.disabledFieldWrapper}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.disabledInputRow}>
              <Mail size={18} color={colors.textLight} />
              <Text style={styles.disabledInputText}>{user?.email || 'student@demo.com'}</Text>
              <View style={styles.lockBadge}>
                <Lock size={12} color={colors.textLight} />
                <Text style={styles.lockBadgeText}>Read only</Text>
              </View>
            </View>
            <Text style={styles.fieldHint}>Email address cannot be changed.</Text>
          </View>
        </View>

        {/* Helpful Tip Card */}
        <View style={styles.tipCard}>
          <HelpCircle size={18} color={colors.accent} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Profile Tip</Text>
            <Text style={styles.tipText}>
              Adding a clear profile photo helps verified educators recognize you and prepare for
              your 1-on-1 consultations.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title={isSaving ? 'Saving Changes...' : 'Save Profile'}
            onPress={() => handleSubmit(onSubmit)()}
            loading={isSaving}
            icon={<Save size={18} color="#FFFFFF" />}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            disabled={isSaving}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>Discard Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerSaveBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  headerSaveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  headerSaveText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Disabled field
  disabledFieldWrapper: {
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  disabledInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  disabledInputText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },

  // Actions
  actionSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
