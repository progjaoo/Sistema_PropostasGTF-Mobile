import { Image, type ImageContentFit } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BRAND } from '@/src/config/brand';

export type BrandLogoVariant = 'complete' | 'horizontal' | 'logo' | 'icon';

export type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: number;
  width?: number;
  height?: number;
  contentFit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function BrandLogo({
  variant = 'complete',
  size,
  width,
  height,
  contentFit = 'contain',
  style,
  testID,
}: BrandLogoProps) {
  const isIcon = variant === 'icon';
  const resolvedWidth = width ?? size ?? (isIcon ? 68 : 120);
  const resolvedHeight = height ?? size ?? (isIcon ? 68 : 22);

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={BRAND.accessibilityLabel}
      style={[styles.container, { width: resolvedWidth, height: resolvedHeight }, style]}
    >
      <Image
        source={isIcon ? BRAND.assets.icon : BRAND.assets.logo}
        contentFit={contentFit}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
