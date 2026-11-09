import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { IMAGE_PUBLIC_URL } from '@/constants/config';
import { colors, radius, shadows } from '@/constants/theme';
import { uploadFile } from './imageChunksUpload';
import { ImagePickerModal } from './imagePickerModal';

export const resolveImageUrl = (val?: string | null): string => {
  if (!val || val === 'undefined' || val === 'null' || val.trim() === '') return '';
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('file://')) {
    return val;
  }
  return `${IMAGE_PUBLIC_URL}/${val.replace(/^\/+/, '')}`;
};

export type ImagePickerProps = {
  value?: string | null;
  onChange: (uri: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  folderName?: string;
  size?: number;
  shape?: 'circle' | 'rounded' | 'square';
  showCameraBadge?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ImagePicker = ({
  value,
  onChange,
  isLoading = false,
  placeholder = 'Add Photo',
  folderName = 'avatars',
  size = 110,
  shape = 'circle',
  showCameraBadge = true,
  disabled = false,
  style,
}: ImagePickerProps) => {
  const [openModal, setOpenModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const displayUrl = resolveImageUrl(value);
  const hasValidImage = Boolean(displayUrl);

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'rounded' ? radius.lg : radius.sm;

  const uploadImage = async (fileUri: string) => {
    setIsUploading(true);

    try {
      const result = await uploadFile(fileUri, folderName);
      const publicUrl = `${IMAGE_PUBLIC_URL}/${result}`;
      onChange(publicUrl);
    } catch (error) {
      console.error('Image upload failed:', error);
      Alert.alert(
        'Upload Failed',
        'Could not upload image. Please check your network connection and try again.',
      );
    } finally {
      setIsUploading(false);
      setOpenModal(false);
    }
  };

  const handlePress = () => {
    if (disabled || isUploading || isLoading) return;
    setOpenModal(true);
  };

  const showLoading = isLoading || isUploading;

  return (
    <View style={[styles.wrapper, style]}>
      <Modal
        visible={openModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenModal(false)}
      >
        <ImagePickerModal setUri={uploadImage} setOpenModal={setOpenModal} />
      </Modal>

      <Pressable
        onPress={handlePress}
        disabled={disabled || showLoading}
        style={({ pressed }) => [
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
          },
          pressed && styles.pressed,
        ]}
      >
        {showLoading ? (
          <View style={[styles.loadingBox, { borderRadius }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{isUploading ? 'Uploading...' : 'Loading...'}</Text>
          </View>
        ) : hasValidImage ? (
          <Image
            source={{ uri: displayUrl }}
            style={[styles.image, { borderRadius }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.placeholderBox, { borderRadius }]}>
            <Ionicons
              name="camera-outline"
              size={Math.max(24, Math.floor(size * 0.28))}
              color={colors.textLight}
            />
            {placeholder ? (
              <Text style={styles.placeholderText} numberOfLines={2}>
                {placeholder}
              </Text>
            ) : null}
          </View>
        )}

        {/* Camera action badge */}
        {showCameraBadge && !showLoading && (
          <View
            style={[
              styles.badge,
              {
                bottom: shape === 'circle' ? 2 : -4,
                right: shape === 'circle' ? 2 : -4,
              },
            ]}
          >
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: colors.surfaceMuted,
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  loadingBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.sm,
  },
});
