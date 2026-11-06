import type { ChatMessage } from '@expert/shared';
import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface ChatBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser }) => {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isCurrentUser ? styles.containerUser : styles.containerOther]}>
      {!isCurrentUser && <Text style={styles.senderName}>{message.senderName}</Text>}
      <View style={[styles.bubble, isCurrentUser ? styles.bubbleUser : styles.bubbleOther]}>
        <Text style={[styles.text, isCurrentUser ? styles.textUser : styles.textOther]}>
          {message.content}
        </Text>
        <Text style={[styles.time, isCurrentUser ? styles.timeUser : styles.timeOther]}>
          {formattedTime}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 4,
    paddingHorizontal: spacing.md,
    maxWidth: '82%',
  },
  containerUser: {
    alignSelf: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: colors.white,
  },
  textOther: {
    color: colors.text,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeOther: {
    color: colors.textLight,
  },
});
