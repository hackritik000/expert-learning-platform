import { Ionicons } from '@expo/vector-icons';
import { API_ROUTES, type ChatRoom } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SearchTrigger } from '@/components/ui/SearchTrigger';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

function formatChatTime(dateStr?: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

type ChatItemProps = {
  chat: ChatRoom;
  isEducator: boolean;
  onPress: () => void;
};

function ChatItem({ chat, isEducator, onPress }: ChatItemProps) {
  const hasUnread = chat.unreadCount > 0;
  const partnerName = isEducator ? chat.userName || 'Student' : chat.educatorName;
  const partnerAvatar = isEducator
    ? chat.userAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    : chat.educatorAvatar ||
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80';

  return (
    <Pressable
      style={({ pressed }) => [styles.chatItem, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: partnerAvatar }} style={styles.avatar} />
        {!isEducator && chat.isOnline && <View style={styles.onlineIndicator} />}
        {isEducator && <View style={[styles.onlineIndicator, styles.studentIndicator]} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.chatName} numberOfLines={1}>
              {partnerName}
            </Text>
            {isEducator && (
              <View style={styles.studentBadge}>
                <Text style={styles.studentBadgeText}>Student</Text>
              </View>
            )}
          </View>
          <Text style={[styles.time, hasUnread && styles.unreadTime]}>
            {formatChatTime(chat.lastMessageAt)}
          </Text>
        </View>

        {chat.sessionStatus && (
          <View style={styles.sessionStatusRow}>
            {chat.sessionStatus.status === 'active' ? (
              <View style={[styles.sessionBadge, styles.sessionBadgeActive]}>
                <View style={styles.miniGreenDot} />
                <Text style={styles.sessionBadgeTextActive}>Active Session</Text>
              </View>
            ) : chat.sessionStatus.status === 'upcoming' ? (
              <View style={[styles.sessionBadge, styles.sessionBadgeUpcoming]}>
                <Text style={styles.sessionBadgeTextUpcoming} numberOfLines={1}>
                  {chat.sessionStatus.nextBooking?.date} {chat.sessionStatus.nextBooking?.startTime}
                </Text>
              </View>
            ) : chat.sessionStatus.status === 'expired' ? (
              <View style={[styles.sessionBadge, styles.sessionBadgeExpired]}>
                <Text style={styles.sessionBadgeTextExpired}>Session Ended</Text>
              </View>
            ) : (
              <View style={[styles.sessionBadge, styles.sessionBadgeNoBooking]}>
                <Text style={styles.sessionBadgeTextNoBooking}>Slot Required</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.messageRow}>
          <View style={styles.messagePreview}>
            <Text style={[styles.lastMessage, hasUnread && styles.unreadMessage]} numberOfLines={1}>
              {chat.lastMessage || 'No messages yet'}
            </Text>
          </View>

          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function ChatsScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const isEducator = user?.role === 'educator';

  const {
    data: chatsData = [],
    isLoading: loadingChats,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ['chats', user?.id, user?.role],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ChatRoom[] }>(
        API_ROUTES.CHAT.ROOMS,
      );
      return res.data.data;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: ChatRoom) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: chat.id, chatId: chat.id, educatorId: chat.educatorId },
    });
  };

  const filteredChats = useMemo(() => {
    // Exclude any self-chat where userId matches current educator
    const validChats = chatsData.filter((c) => !isEducator || c.userId !== user?.id);
    if (!search.trim()) return validChats;
    const query = search.toLowerCase();
    return validChats.filter((c) => {
      const name = isEducator ? c.userName || '' : c.educatorName || '';
      const last = c.lastMessage || '';
      return name.toLowerCase().includes(query) || last.toLowerCase().includes(query);
    });
  }, [chatsData, search, isEducator, user?.id]);

  if (loadingChats) {
    return <LoadingSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {isEducator ? 'Connect with your students' : 'Connect with your educators'}
          </Text>
        </View>

        <Pressable style={styles.headerButton} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <SearchTrigger />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Conversations</Text>
        <Text style={styles.chatCount}>{filteredChats.length} chats</Text>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem
            chat={item}
            isEducator={Boolean(isEducator)}
            onPress={() => handleChatPress(item)}
          />
        )}
        contentContainerStyle={[styles.listContent, filteredChats.length === 0 && styles.emptyList]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptyDescription}>
              {search.trim()
                ? 'Try searching with a different name or keyword.'
                : isEducator
                  ? 'No students have messaged you yet. When students book consultations or reach out, their messages will appear here.'
                  : 'Start exploring educators to schedule consultations and ask questions.'}
            </Text>
          </View>
        }
      />

      {!isEducator && (
        <Pressable
          style={styles.fab}
          onPress={() => {
            router.push('/explore');
          }}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchContainer: {
    marginHorizontal: spacing.lg,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  sectionHeader: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chatCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.65,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: radius.full,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.background,
  },
  studentIndicator: {
    backgroundColor: colors.primary,
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chatName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '75%',
  },
  studentBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  studentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  time: {
    fontSize: 11,
    color: colors.textLight,
  },
  unreadTime: {
    color: colors.primary,
    fontWeight: '600',
  },
  sessionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    gap: 4,
  },
  sessionBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  sessionBadgeUpcoming: {
    backgroundColor: '#FEF3C7',
  },
  sessionBadgeExpired: {
    backgroundColor: '#F3F4F6',
  },
  sessionBadgeNoBooking: {
    backgroundColor: '#FEE2E2',
  },
  miniGreenDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  sessionBadgeTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  sessionBadgeTextUpcoming: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  sessionBadgeTextExpired: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sessionBadgeTextNoBooking: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  messagePreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 70,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
