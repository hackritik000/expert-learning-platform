import { zodResolver } from '@hookform/resolvers/zod';
import { API_ROUTES, type Educator, type Subject } from '@repo/shared';
import { type UpdateEducatorProfileFormData, updateEducatorProfileSchema } from '@repo/validation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  Clock,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  Languages,
  Save,
  Sparkles,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImagePicker } from '@/components/images/imagePicker';
import { InputField } from '@/components/ui/InputField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Gujarati',
  'Punjabi',
];

const RATE_PRESETS = [300, 500, 750, 1000, 1500];

export default function EditEducatorProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Fetch educator details
  const { data: educatorData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['my-educator-profile', user?.id],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: Educator }>(
          API_ROUTES.EDUCATORS.ME,
        );
        return res.data.data;
      } catch {
        // Fallback to searching detail by educator user ID if /me fails
        if (user?.id) {
          const detailRes = await apiClient.get<{ success: boolean; data: Educator }>(
            API_ROUTES.EDUCATORS.DETAIL(user.id),
          );
          return detailRes.data.data;
        }
        return null;
      }
    },
    enabled: !!user?.id,
  });

  // Fetch all available subjects
  const { data: allSubjects = [], isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Subject[] }>(
        API_ROUTES.SUBJECTS.LIST,
      );
      return res.data.data;
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors: formErrors },
  } = useForm<UpdateEducatorProfileFormData>({
    resolver: zodResolver(updateEducatorProfileSchema),
    defaultValues: {
      name: user?.name || '',
      title: '',
      bio: '',
      avatarUrl: user?.avatarUrl || '',
      experienceYears: 1,
      hourlyRate: 500,
      education: '',
      languages: ['English'],
      subjects: [],
    },
  });

  // Pre-populate form when educator data loads
  useEffect(() => {
    if (educatorData) {
      const currentSubjects = educatorData.subjects?.map((s) => s.id) || [];
      setSelectedSubjectIds(currentSubjects);
      setIsOnline(Boolean(educatorData.isOnline));

      reset({
        name: educatorData.name || user?.name || '',
        title: educatorData.title || '',
        bio: educatorData.bio || '',
        avatarUrl: educatorData.avatarUrl || user?.avatarUrl || '',
        experienceYears: educatorData.experienceYears ?? 1,
        hourlyRate: educatorData.hourlyRate ?? 500,
        education: educatorData.education || '',
        languages:
          educatorData.languages && educatorData.languages.length > 0
            ? educatorData.languages
            : ['English'],
        subjects: currentSubjects,
      });
    } else if (user) {
      reset({
        name: user.name || '',
        title: '',
        bio: '',
        avatarUrl: user.avatarUrl || '',
        experienceYears: 1,
        hourlyRate: 500,
        education: '',
        languages: ['English'],
        subjects: [],
      });
    }
  }, [educatorData, user, reset]);

  const languages = useWatch({ control, name: 'languages' }) ?? [];
  const bio = useWatch({ control, name: 'bio' }) ?? '';
  const hourlyRate = useWatch({ control, name: 'hourlyRate' }) ?? 500;
  const avatarUrl = useWatch({ control, name: 'avatarUrl' }) ?? '';

  const toggleLanguage = (lang: string) => {
    const updated = languages.includes(lang)
      ? languages.filter((item) => item !== lang)
      : [...languages, lang];

    setValue('languages', updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const toggleSubject = (subjectId: string) => {
    const updated = selectedSubjectIds.includes(subjectId)
      ? selectedSubjectIds.filter((id) => id !== subjectId)
      : [...selectedSubjectIds, subjectId];

    setSelectedSubjectIds(updated);
    setValue('subjects', updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (data: UpdateEducatorProfileFormData) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);

      const payload = {
        name: data.name?.trim(),
        title: data.title?.trim(),
        bio: data.bio?.trim(),
        education: data.education?.trim(),
        experienceYears: Number(data.experienceYears),
        hourlyRate: Number(data.hourlyRate),
        languages: data.languages && data.languages.length > 0 ? data.languages : ['English'],
        subjects: selectedSubjectIds,
        avatarUrl: data.avatarUrl || avatarUrl,
        isOnline,
      };

      await apiClient.post(API_ROUTES.EDUCATORS.UPDATE(user.id), payload);

      // Synchronize auth user store if name or avatar changed
      if (data.name || payload.avatarUrl) {
        await updateUser({
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(payload.avatarUrl ? { avatarUrl: payload.avatarUrl } : {}),
        });
      }

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['my-educator-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['educator'] });
      await queryClient.invalidateQueries({ queryKey: ['educators'] });

      Alert.alert('Success', 'Your educator profile has been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update educator profile. Please try again.';
      Alert.alert('Update Failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading || isSubjectsLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingStateText}>Loading profile details...</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Educator Profile</Text>
          <Text style={styles.headerSubtitle}>Faculty & Mentorship</Text>
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
        {/* Profile Avatar & Name Card */}
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
                  size={104}
                  shape="circle"
                  placeholder="Upload Photo"
                />
              )}
            />

            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <Sparkles size={12} color={colors.primary} />
                <Text style={styles.verifiedBadgeText}>VERIFIED EDUCATOR</Text>
              </View>
            </View>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Full Name *"
                placeholder="e.g. Dr. Ananya Verma"
                value={value}
                onChangeText={onChange}
                error={formErrors.name?.message}
                leftIcon={<User size={18} color={colors.textLight} />}
              />
            )}
          />
        </View>

        {/* Live Availability Switch Card */}
        <View style={styles.card}>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityInfo}>
              <View style={styles.statusDotRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? colors.success : colors.textLight },
                  ]}
                />
                <Text style={styles.availabilityTitle}>
                  {isOnline ? 'Available for Instant Sessions' : 'Currently Offline'}
                </Text>
              </View>
              <Text style={styles.availabilityDesc}>
                {isOnline
                  ? 'Students can see you in the "Online Now" section and book consultations immediately.'
                  : 'You will only receive scheduled slot bookings.'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Availability Slots Management Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#CCFBF1' }]}>
              <Calendar size={18} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Consultation Time Slots</Text>
              <Text style={styles.cardSubtitle}>
                Add, edit, or remove your available booking slots
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.manageSlotsLinkBtn}
            onPress={() => router.push('/educator/manage-slots')}
            activeOpacity={0.8}
          >
            <Calendar size={16} color="#FFFFFF" />
            <Text style={styles.manageSlotsLinkText}>Manage Availability Slots</Text>
          </TouchableOpacity>
        </View>

        {/* Professional Details Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Award size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Professional Information</Text>
              <Text style={styles.cardSubtitle}>Your credentials and academic experience</Text>
            </View>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Professional Headline / Title *"
                placeholder="e.g. Senior Physics Faculty | Ex-IITian | 8+ Yrs Exp"
                value={value}
                onChangeText={onChange}
                error={formErrors.title?.message}
                leftIcon={<Briefcase size={18} color={colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="education"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Education & Degrees *"
                placeholder="e.g. M.Sc. Physics - IIT Bombay, B.Ed"
                value={value}
                onChangeText={onChange}
                error={formErrors.education?.message}
                leftIcon={<GraduationCap size={18} color={colors.textLight} />}
              />
            )}
          />

          <Controller
            control={control}
            name="experienceYears"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Years of Experience *"
                placeholder="e.g. 8"
                keyboardType="numeric"
                value={value !== undefined ? String(value) : ''}
                onChangeText={(text) => onChange(text ? Number(text) : 0)}
                error={formErrors.experienceYears?.message}
                leftIcon={<Clock size={18} color={colors.textLight} />}
              />
            )}
          />
        </View>

        {/* Subject Specializations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <BookOpen size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Teaching Subjects *</Text>
              <Text style={styles.cardSubtitle}>Select all academic subjects you mentor</Text>
            </View>
          </View>

          <View style={styles.chipsContainer}>
            {allSubjects.map((subject) => {
              const isSelected = selectedSubjectIds.includes(subject.id);
              return (
                <TouchableOpacity
                  key={subject.id}
                  activeOpacity={0.7}
                  onPress={() => toggleSubject(subject.id)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" style={{ marginRight: 6 }} />}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Consultation Pricing Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <IndianRupee size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Consultation Rate</Text>
              <Text style={styles.cardSubtitle}>Fee charged per 45-minute 1-on-1 session</Text>
            </View>
          </View>

          <Controller
            control={control}
            name="hourlyRate"
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Rate per Session (₹ INR) *"
                placeholder="500"
                keyboardType="numeric"
                value={value !== undefined ? String(value) : ''}
                onChangeText={(text) => onChange(text ? Number(text) : 0)}
                error={formErrors.hourlyRate?.message}
                leftIcon={<IndianRupee size={18} color={colors.primary} />}
              />
            )}
          />

          <Text style={styles.quickSelectLabel}>Quick Pricing Presets:</Text>
          <View style={styles.presetsRow}>
            {RATE_PRESETS.map((amt) => {
              const active = hourlyRate === amt;
              return (
                <TouchableOpacity
                  key={`rate-${amt}`}
                  activeOpacity={0.7}
                  onPress={() =>
                    setValue('hourlyRate', amt, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  style={[styles.ratePresetChip, active && styles.ratePresetChipActive]}
                >
                  <Text style={[styles.ratePresetText, active && styles.ratePresetTextActive]}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Languages of Instruction */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Languages size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Languages of Instruction *</Text>
              <Text style={styles.cardSubtitle}>Languages you can conduct consultations in</Text>
            </View>
          </View>

          <View style={styles.chipsContainer}>
            {AVAILABLE_LANGUAGES.map((lang) => {
              const selected = languages.includes(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  activeOpacity={0.7}
                  onPress={() => toggleLanguage(lang)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  {selected && <Check size={14} color="#FFFFFF" style={{ marginRight: 6 }} />}
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{lang}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Biography & Teaching Style */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Sparkles size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Biography & Teaching Style *</Text>
              <Text style={styles.cardSubtitle}>
                Introduce yourself, your track record, and how you help students
              </Text>
            </View>
          </View>

          <View
            style={[styles.textAreaWrapper, formErrors.bio?.message && styles.textAreaWrapperError]}
          >
            <Controller
              control={control}
              name="bio"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="Detail your background, teaching philosophy, problem-solving methods..."
                  placeholderTextColor={colors.textLight}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={600}
                  style={styles.textArea}
                />
              )}
            />
          </View>

          <View style={styles.bioMetaRow}>
            {formErrors.bio?.message ? (
              <Text style={styles.errorTextInline}>{formErrors.bio.message}</Text>
            ) : (
              <Text style={styles.characterCount}>Minimum 10 characters</Text>
            )}
            <Text style={styles.characterCount}>{bio.length}/600</Text>
          </View>
        </View>

        {/* Profile Tip */}
        <View style={styles.tipCard}>
          <HelpCircle size={18} color={colors.accent} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Faculty Profile Tip</Text>
            <Text style={styles.tipText}>
              Educators with high quality photos, clear credentials, and active online availability
              receive up to 3x more consultation bookings.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title={isSaving ? 'Saving Changes...' : 'Save Educator Profile'}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingStateText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
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
    marginBottom: spacing.md,
  },
  badgeRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
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
  manageSlotsLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: spacing.xs + 2,
  },
  manageSlotsLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Availability
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  availabilityDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // Pricing
  quickSelectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  ratePresetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratePresetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratePresetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  ratePresetTextActive: {
    color: '#FFFFFF',
  },

  // Textarea
  textAreaWrapper: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  textAreaWrapperError: {
    borderColor: colors.error,
    backgroundColor: `${colors.errorLight}20`,
  },
  textArea: {
    minHeight: 100,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  bioMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  characterCount: {
    fontSize: 11,
    color: colors.textLight,
  },
  errorTextInline: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
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
