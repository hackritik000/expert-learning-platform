import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Pencil,
  Shield,
  Sparkles,
} from 'lucide-react-native';

import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveImageUrl } from '../../components/images/imagePicker';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, logout } = useAuthStore();

  const handleEditProfile = () => {
    if (user?.role === 'educator') {
      router.push('/profile/edit-educator');
    } else {
      router.push('/profile/edit-student');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Information */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                resolveImageUrl(user?.avatarUrl) ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
            contentFit="cover"
          />

          <Text style={styles.name}>{user?.name || 'Scholar Student'}</Text>

          <Text style={styles.email}>{user?.email || 'student@demo.com'}</Text>

          <View style={styles.roleBadge}>
            <Shield size={12} color={colors.primary} />
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
          </View>

          {/* Edit Profile */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEditProfile}
            style={styles.editButton}
          >
            <Pencil size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Educator Slot Management */}
          {user?.role === 'educator' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/educator/manage-slots')}
              style={styles.manageSlotsButton}
            >
              <Calendar size={16} color="#FFFFFF" />
              <Text style={styles.manageSlotsButtonText}>Manage Available Slots</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Demo Credentials */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={styles.demoTitle}>Assignment Demo Credentials</Text>
          </View>

          <Text style={styles.demoItem}>• Student: student@demo.com / password123</Text>

          <Text style={styles.demoItem}>• Educator: ananya@expert.com / password123</Text>

          <Text style={styles.demoNote}>
            Tokens persist in Expo SecureStore across app cold reloads.
          </Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <HelpCircle size={20} color={colors.textLight} />
            <Text style={styles.menuText}>Help & Support</Text>
            <View style={{ flex: 1 }} />
            <ChevronRight size={18} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <FileText size={20} color={colors.textLight} />
            <Text style={styles.menuText}>Terms & Privacy Policy</Text>
            <View style={{ flex: 1 }} />
            <ChevronRight size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color={colors.error} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
    width: '100%',
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  manageSlotsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#0D9488', // Teal accent distinguishing slot management
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.xs + 4,
    width: '100%',
  },
  manageSlotsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  demoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  demoItem: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.primary,
  },
  demoNote: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 8,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
});
