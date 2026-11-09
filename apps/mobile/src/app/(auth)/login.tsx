import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginFormData, loginSchema } from '@repo/validation';
import { useRouter } from 'expo-router';
import { GraduationCap, Lock, Mail, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    resetOptions: {
      keepValues: true,
    },
  });

  useEffect(() => {
    console.log('LOGIN SCREEN MOUNTED');

    return () => {
      console.log('LOGIN SCREEN UNMOUNTED');
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setFormError(null);
      await login(data);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Login failed. Please verify your credentials.',
      );
    }
  };

  const fillDemoAccount = (isEducator: boolean) => {
    if (isEducator) {
      setValue('email', 'ananya@expert.com');
    } else {
      setValue('email', 'student@demo.com');
    }
    setValue('password', 'password123');
    setFormError(null);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <GraduationCap size={36} color={colors.white} />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to consult verified top educators & mentors</Text>
      </View>

      {/* Demo Credentials Quick-Fill Banner */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => fillDemoAccount(false)}
        style={styles.demoBanner}
      >
        <View style={styles.demoHeader}>
          <Sparkles size={16} color={colors.accent} />
          <Text style={styles.demoTitle}>One-Click to Student Demo Login</Text>
        </View>
        <Text style={styles.demoSubtitle}>
          Tap here to auto-fill <Text style={styles.boldText}>student@demo.com</Text> /{' '}
          <Text style={styles.boldText}>password123</Text>
        </Text>
      </TouchableOpacity>

      {/* Demo Credentials Quick-Fill Banner */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => fillDemoAccount(true)}
        style={styles.demoBanner}
      >
        <View style={styles.demoHeader}>
          <Sparkles size={16} color={colors.accent} />
          <Text style={styles.demoTitle}>One-Click to Educator Demo Login</Text>
        </View>
        <Text style={styles.demoSubtitle}>
          Tap here to auto-fill <Text style={styles.boldText}>ananya@expert.com</Text> /{' '}
          <Text style={styles.boldText}>password123</Text>
        </Text>
      </TouchableOpacity>

      {formError || error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{formError || error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.email?.message}
              leftIcon={<Mail size={18} color={colors.textLight} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.password?.message}
              leftIcon={<Lock size={18} color={colors.textLight} />}
            />
          )}
        />

        <PrimaryButton
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          style={styles.submitBtn}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  demoBanner: {
    backgroundColor: colors.accentLight,
    borderWidth: 1.2,
    borderColor: `${colors.accent}40`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  demoSubtitle: {
    fontSize: 12,
    color: colors.text,
  },
  boldText: {
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
