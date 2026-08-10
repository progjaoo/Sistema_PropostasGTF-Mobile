import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';

type UIBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function UIBottomSheet({ visible, onClose, children, style, testID }: UIBottomSheetProps) {
  const colors = useColors();
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 28 }],
  }));

  const handleClose = () => {
    progress.value = withTiming(
      0,
      {
        duration: 160,
        easing: Easing.in(Easing.cubic),
      },
      () => runOnJS(onClose)(),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root} testID={testID}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            sheetStyle,
            style,
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  sheet: {
    borderTopLeftRadius: tokens.radius.xxl,
    borderTopRightRadius: tokens.radius.xxl,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: tokens.radius.full,
    alignSelf: 'center',
  },
});
