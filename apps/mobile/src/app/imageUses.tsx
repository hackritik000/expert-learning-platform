import { useState } from 'react';
import { Text, View } from 'react-native';
import { ImagePicker } from '@/components/images/imagePicker';

export default function Home() {
  const [change, onChange] = useState('');
  return (
    <View>
      <ImagePicker
        onChange={(url) => onChange(url)}
        value={change}
        placeholder={'Hello'}
        folderName={'unknown'}
      />
      <Text>{change}</Text>
    </View>
  );
}
