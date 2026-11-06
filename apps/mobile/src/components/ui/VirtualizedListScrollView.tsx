import { forwardRef } from 'react';
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewRef,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ScrollViewProps } from 'react-native';
import type { KeyboardChatScrollViewProps } from 'react-native-keyboard-controller';

const BOTTOM_OFFSET = 8; // distance from safe area to input

const VirtualizedListScrollView = forwardRef<
  KeyboardChatScrollViewRef,
  ScrollViewProps & KeyboardChatScrollViewProps
>(({ inverted, ...props }, ref) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <KeyboardChatScrollView
      ref={ref}
      inverted={inverted}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      offset={bottom - BOTTOM_OFFSET}
      {...props}
    />
  );
});

export default VirtualizedListScrollView;
