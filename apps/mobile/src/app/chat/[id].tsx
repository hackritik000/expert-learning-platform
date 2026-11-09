import { API_ROUTES, type ChatMessage, type ChatRoom } from '@repo/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VirtualizedListScrollView from '@/components/ui/VirtualizedListScrollView';
import { AvailabilityBadge } from '../../components/ui/AvailabilityBadge';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const EDUCATOR_QUICK_REPLIES = [
  'Hello! How can I help you today?',
  'Looking forward to our consultation session!',
  'Please feel free to share any syllabus details or specific questions.',
  'I will prepare customized notes for our upcoming session.',
];

export default function ChatScreen() {
  const { id: paramId, chatId } = useLocalSearchParams<{
    id: string;
    chatId?: string;
  }>();
  const navigation = useNavigation();
  const inset = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isEducator = user?.role === 'educator';

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const targetId = chatId || paramId;

  // 1. Get or create chat room for this target (chat room ID or educator ID)
  const {
    data: chatRoom,
    isLoading: loadingRoom,
    isError: roomError,
    error: roomErrorObj,
  } = useQuery({
    queryKey: ['chatRoom', targetId],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: ChatRoom;
      }>(API_ROUTES.CHAT.ROOM(targetId!));
      return res.data.data;
    },
    enabled: Boolean(targetId),
  });

  const isSelfChat = Boolean(isEducator && chatRoom && chatRoom.userId === user?.id);
  const sessionStatus = chatRoom?.sessionStatus;
  const isStudent = !isEducator;
  const canChat = isEducator ? true : Boolean(sessionStatus?.canChat);

  // Set navigation header dynamically based on current user role
  useEffect(() => {
    if (chatRoom && !isSelfChat) {
      const partnerName = isEducator ? chatRoom.userName || 'Student' : chatRoom.educatorName;
      const partnerAvatar = isEducator
        ? chatRoom.userAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
        : chatRoom.educatorAvatar ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80';

      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerContainer}>
            <Image source={{ uri: partnerAvatar }} style={styles.headerAvatar} contentFit="cover" />
            <View>
              <Text style={styles.headerName}>{partnerName}</Text>
              {isEducator ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Student</Text>
                </View>
              ) : (
                <AvailabilityBadge isOnline={chatRoom.isOnline} />
              )}
            </View>
          </View>
        ),
      });
    }
  }, [chatRoom, navigation, isEducator, isSelfChat]);

  // 2. Fetch messages for the room with polling every 3 seconds
  const {
    data: messages = [],
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chatMessages', chatRoom?.id],
    queryFn: async () => {
      if (!chatRoom?.id) return [];
      const res = await apiClient.get<{ success: boolean; data: ChatMessage[] }>(
        API_ROUTES.CHAT.MESSAGES(chatRoom.id),
      );
      return res.data.data.reverse();
    },
    enabled: Boolean(chatRoom?.id),
    refetchInterval: 3000,
  });

  // 3. Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post(API_ROUTES.CHAT.MESSAGES(chatRoom!.id), {
        content,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setInputText('');
      refetchMessages();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Cannot send message';
      Alert.alert('Session Restriction', msg);
    },
  });

  const handleSend = () => {
    if (!canChat) {
      Alert.alert(
        'Session Restriction',
        sessionStatus?.message || 'You can only talk during your purchased consultation time slot.',
      );
      return;
    }
    if (!inputText.trim() || !chatRoom?.id || sendMutation.isPending || isSelfChat) return;
    sendMutation.mutate(inputText.trim());
  };

  const handleQuickReply = (reply: string) => {
    setInputText(reply);
  };

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => <VirtualizedListScrollView {...props} />,
    [],
  );

  if (
    isSelfChat ||
    (roomError &&
      String((roomErrorObj as any)?.response?.data?.error || '')
        .toLowerCase()
        .includes('themselves'))
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.centerLoading}>
          <EmptyState
            title="Cannot Chat With Yourself Or With Another Educators"
            description="Educators cannot start a consultation chat with their own educator profile."
            actionTitle="Go Back"
            onAction={() => navigation.goBack()}
            icon={<MessageSquare size={36} color={colors.primary} />}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardGestureArea interpolator="ios" offset={10} style={styles.container}>
        {/* Session Timing & Status Banner */}
        {sessionStatus && (
          <View
            style={[
              styles.sessionBanner,
              sessionStatus.status === 'active' && styles.sessionBannerActive,
              sessionStatus.status === 'upcoming' && styles.sessionBannerUpcoming,
              sessionStatus.status === 'expired' && styles.sessionBannerExpired,
              sessionStatus.status === 'no_booking' && styles.sessionBannerNoBooking,
            ]}
          >
            {sessionStatus.status === 'active' ? (
              <View style={styles.bannerRow}>
                <View style={styles.livePulseDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionBannerTitleActive}>
                    Live Consultation Session Active
                  </Text>
                  <Text style={styles.sessionBannerSubtitleActive}>
                    {isEducator
                      ? `Active consultation with ${chatRoom?.userName || 'student'} until ${sessionStatus.activeBooking?.endTime}`
                      : `You can chat with your mentor until ${sessionStatus.activeBooking?.endTime}`}
                  </Text>
                </View>
              </View>
            ) : sessionStatus.status === 'upcoming' ? (
              <View style={styles.bannerRow}>
                <Clock size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionBannerTitleUpcoming}>
                    Session Scheduled: {sessionStatus.nextBooking?.date}
                  </Text>
                  <Text style={styles.sessionBannerSubtitleUpcoming}>
                    {isEducator
                      ? `Scheduled consultation with ${chatRoom?.userName || 'student'} (${sessionStatus.nextBooking?.startTime} - ${sessionStatus.nextBooking?.endTime}).`
                      : `Chat unlocks automatically during your scheduled slot (${sessionStatus.nextBooking?.startTime} - ${sessionStatus.nextBooking?.endTime}). You cannot talk before your purchased time.`}
                  </Text>
                </View>
              </View>
            ) : sessionStatus.status === 'expired' ? (
              <View style={styles.bannerCol}>
                <View style={styles.bannerRow}>
                  <Clock size={18} color={colors.textLight} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionBannerTitleExpired}>Consultation Session Ended</Text>
                    <Text style={styles.sessionBannerSubtitleExpired}>
                      {sessionStatus.lastBooking
                        ? `Your consultation on ${sessionStatus.lastBooking.date} ended at ${sessionStatus.lastBooking.endTime}. You cannot talk after your purchased time.`
                        : 'Your consultation session has ended. You cannot talk after your purchased time.'}
                    </Text>
                  </View>
                </View>
                {isStudent && chatRoom?.educatorId && (
                  <TouchableOpacity
                    style={styles.bookSlotActionBtn}
                    onPress={() => router.push(`/educator/${chatRoom.educatorId}`)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={14} color="#FFFFFF" />
                    <Text style={styles.bookSlotActionText}>Book New Consultation Slot</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              // no_booking
              <View style={styles.bannerCol}>
                <View style={styles.bannerRow}>
                  <AlertCircle size={18} color={colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionBannerTitleNoBooking}>
                      Time Slot Purchase Required
                    </Text>
                    <Text style={styles.sessionBannerSubtitleNoBooking}>
                      {isEducator
                        ? `Student ${chatRoom?.userName || ''} has not purchased a consultation slot yet.`
                        : 'You cannot chat with this educator without purchasing an available consultation time slot first.'}
                    </Text>
                  </View>
                </View>
                {isStudent && chatRoom?.educatorId && (
                  <TouchableOpacity
                    style={styles.bookSlotActionBtn}
                    onPress={() => router.push(`/educator/${chatRoom.educatorId}`)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={14} color="#FFFFFF" />
                    <Text style={styles.bookSlotActionText}>Book Consultation Slot</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {loadingRoom || loadingMessages ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting to consultation room...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() =>
              messages.length === 0 && (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <EmptyState
                    title={isEducator ? 'No Messages Yet' : 'Start Consultation Chat'}
                    description={
                      isEducator
                        ? `Reply to ${chatRoom?.userName || 'your student'} to guide them on their consultation!`
                        : `Say hello to ${chatRoom?.educatorName || 'your mentor'}! Ask questions or share session topics.`
                    }
                    icon={
                      isEducator ? (
                        <MessageSquare size={32} color={colors.primary} />
                      ) : (
                        <Sparkles size={32} color={colors.primary} />
                      )
                    }
                  />
                </View>
              )
            }
            renderItem={({ item }) => {
              const isCurrentUser = user
                ? item.senderId === user.id
                : item.senderRole === 'student';
              return <ChatBubble message={item} isCurrentUser={isCurrentUser} />;
            }}
            inverted
            contentContainerStyle={styles.messageList}
            renderScrollComponent={renderScrollComponent}
          />
        )}

        {/* Educator Quick Reply Chips */}
        {isEducator && (
          <View style={styles.quickRepliesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRepliesScroll}
            >
              {EDUCATOR_QUICK_REPLIES.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  style={styles.quickReplyChip}
                  onPress={() => handleQuickReply(reply)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReplyText} numberOfLines={1}>
                    {reply}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <KeyboardStickyView offset={{ opened: inset.bottom }} style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, !canChat && styles.textInputDisabled]}
            placeholder={
              !canChat
                ? sessionStatus?.status === 'upcoming'
                  ? `Locked: Session starts at ${sessionStatus.nextBooking?.startTime}`
                  : sessionStatus?.status === 'expired'
                    ? 'Session ended. Book new slot to chat.'
                    : 'Purchase time slot to start chatting.'
                : isEducator
                  ? 'Reply to student...'
                  : 'Type your message...'
            }
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={canChat}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!canChat || !inputText.trim() || sendMutation.isPending}
            style={[
              styles.sendButton,
              (!canChat || !inputText.trim()) && styles.sendButtonDisabled,
            ]}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : !canChat ? (
              <Lock size={16} color={colors.white} />
            ) : (
              <Send size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </KeyboardStickyView>
      </KeyboardGestureArea>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  roleBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  messageList: {
    paddingVertical: spacing.md,
  },
  quickRepliesContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.xs,
  },
  quickRepliesScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  quickReplyChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickReplyText: {
    fontSize: 12,
    color: colors.text,
    maxWidth: 220,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  textInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: colors.textMuted,
  },
  sessionBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sessionBannerActive: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#BBF7D0',
  },
  sessionBannerUpcoming: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  sessionBannerExpired: {
    backgroundColor: '#F9FAFB',
    borderBottomColor: '#E5E7EB',
  },
  sessionBannerNoBooking: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FECACA',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerCol: {
    gap: spacing.xs,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  sessionBannerTitleActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  sessionBannerSubtitleActive: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  sessionBannerTitleUpcoming: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  sessionBannerSubtitleUpcoming: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  sessionBannerTitleExpired: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  sessionBannerSubtitleExpired: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  sessionBannerTitleNoBooking: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  sessionBannerSubtitleNoBooking: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },
  bookSlotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: 4,
    gap: 6,
    alignSelf: 'flex-start',
  },
  bookSlotActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
