import VirtualizedListScrollView from '@/components/ui/VirtualizedListScrollView';
import type { ChatMessage } from '@expert/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Send, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller';
import { AvailabilityBadge } from '../../components/ui/AvailabilityBadge';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { apiClient } from '../../services/api';

export default function ChatScreen() {
  const { id: educatorId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // 1. Get or create chat room for this educator
  const { data: chatRoom, isLoading: loadingRoom } = useQuery({
    queryKey: ['chatRoom', educatorId],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: {
          id: string;
          educatorId: string;
          educatorName: string;
          educatorAvatar: string;
          isOnline: boolean;
        };
      }>(`/api/chats/educator/${educatorId}`);
      return res.data.data;
    },
    enabled: Boolean(educatorId),
  });

  // Set navigation header dynamically with educator info
  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerContainer}>
            <Image
              source={{ uri: chatRoom.educatorAvatar }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <View>
              <Text style={styles.headerName}>{chatRoom.educatorName}</Text>
              <AvailabilityBadge isOnline={chatRoom.isOnline} />
            </View>
          </View>
        ),
      });
    }
  }, [chatRoom, navigation]);

  // 2. Fetch messages for the room with polling every 3 seconds for live replies
  const {
    data: messages = [],
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chatMessages', chatRoom?.id],
    queryFn: async () => {
      if (!chatRoom?.id) return [];
      const res = await apiClient.get<{ success: boolean; data: ChatMessage[] }>(
        `/api/chats/${chatRoom.id}/messages`,
      );
      return res.data.data.reverse();
    },
    enabled: Boolean(chatRoom?.id),
    refetchInterval: 3000, // 3-second polling for simulated or live messaging
  });

  // 3. Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post(`/api/chats/${chatRoom!.id}/messages`, {
        content,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setInputText('');
      refetchMessages();
    },
  });

  const handleSend = () => {
    if (!inputText.trim() || !chatRoom?.id || sendMutation.isPending) return;
    sendMutation.mutate(inputText.trim());
  };

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => <VirtualizedListScrollView {...props} />,
    [],
  );

  return (
    <View style={styles.container}>
      <KeyboardGestureArea interpolator="ios" offset={10} style={styles.container}>
        {loadingRoom || loadingMessages ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting to consultation room...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              title="Start Consultation Chat"
              description={`Say hello to ${chatRoom?.educatorName || 'your mentor'}! Ask questions or share session topics.`}
              icon={<Sparkles size={32} color={colors.primary} />}
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble message={item} isCurrentUser={item.senderRole === 'student'} />
            )}
            inverted
            contentContainerStyle={styles.messageList}
            renderScrollComponent={renderScrollComponent}
          />
        )}

        {/* Input Bar */}
        <KeyboardStickyView style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMutation.isPending}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
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
