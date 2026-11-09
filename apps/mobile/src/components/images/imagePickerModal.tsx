import { Ionicons } from '@expo/vector-icons';
import { type CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { ActivityIndicator, Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ImagePickerModal = ({
  setUri,
  setOpenModal,
}: {
  setUri: (uri: string) => void;
  setOpenModal: (open: boolean) => void;
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const ref = useRef<CameraView>(null);
  const capturing = useRef(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);

  const takePictureFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setUri(result.assets[0].uri);
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Gallery pick error:', error);
    }
  };

  const takePicture = async () => {
    if (capturing.current || !ref.current) return;
    try {
      capturing.current = true;
      setIsProcessing(true);
      const photo = await ref.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        setUri(photo.uri);
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
    } finally {
      capturing.current = false;
      setIsProcessing(false);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { padding: 24 }]}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={48} color="#4f46e5" style={{ marginBottom: 16 }} />
          <Text style={styles.permissionTitle}>Camera Permission</Text>
          <Text style={styles.permissionDesc}>
            We need your permission to use the camera to take profile photos.
          </Text>

          <View style={{ gap: 12, width: '100%', marginTop: 20 }}>
            <Button
              onPress={() => {
                requestPermission();
              }}
              title="Grant Camera Permission"
              color="#4f46e5"
            />
            <Button
              onPress={takePictureFromGallery}
              title="Choose from Gallery Instead"
              color="#10b981"
            />
            <Button onPress={() => setOpenModal(false)} title="Cancel" color="#6b7280" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={ref}
          mode="picture"
          facing={facing}
          mute={true}
          responsiveOrientationWhenOrientationLocked={false}
        />

        {/* Top bar with close button */}
        <View style={[styles.topBar, { top: Math.max(insets.top, 16) }]}>
          <Pressable onPress={() => setOpenModal(false)} style={styles.iconCircleBtn} hitSlop={12}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Bottom Shutter Controls */}
        <View style={[styles.shutterContainer, { bottom: Math.max(insets.bottom, 20) + 16 }]}>
          <Pressable onPress={takePictureFromGallery} style={styles.iconCircleBtn} hitSlop={8}>
            <Ionicons name="images" size={28} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={takePicture}
            disabled={isProcessing}
            style={({ pressed }) => [styles.shutterBtn, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.shutterBtnInner}>
              {isProcessing && <ActivityIndicator size="small" color="#4f46e5" />}
            </View>
          </Pressable>

          <Pressable onPress={toggleFacing} style={styles.iconCircleBtn} hitSlop={8}>
            <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: StyleSheet.absoluteFill,
  camera: StyleSheet.absoluteFill,
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  shutterBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
