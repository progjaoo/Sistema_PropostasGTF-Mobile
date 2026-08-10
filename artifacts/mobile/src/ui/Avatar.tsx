import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useColors } from '@/hooks/useColors';
import { tokens } from '@/src/theme';
import { getInitials } from '@/src/utils/format';

type UIAvatarProps = {
  name?: string | null;
  imageBase64?: string | null;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function UIAvatar({ name, imageBase64, size = 44, color, style, testID }: UIAvatarProps) {
  const colors = useColors();
  const backgroundColor = color ? `${color}1A` : colors.accent;
  const foregroundColor = color ?? colors.primary;

  return (
    <View
      testID={testID}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {imageBase64 ? (
        <Image source={{ uri: imageBase64 }} contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <Text style={[styles.initials, { color: foregroundColor, fontSize: Math.max(12, size * 0.34) }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  initials: {
    fontFamily: 'Inter_800ExtraBold',
  },
});
