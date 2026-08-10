import { Image, type ImageContentFit } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type BrandLogoVariant = 'complete' | 'horizontal';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: number;
  width?: number;
  height?: number;
  contentFit?: ImageContentFit;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const logoComplete = require('../../assets/brand/gtf-logo-completa.png');
const logoHorizontal = require('../../assets/brand/gtf-logo-horizontal.png');

export function BrandLogo({
  variant = 'complete',
  size,
  width,
  height,
  contentFit = 'contain',
  style,
  testID,
}: BrandLogoProps) {
  const isHorizontal = variant === 'horizontal';
  const resolvedWidth = width ?? size ?? (isHorizontal ? 148 : 88);
  const resolvedHeight = height ?? size ?? (isHorizontal ? 34 : 88);

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="GTF Propostas"
      style={[styles.container, { width: resolvedWidth, height: resolvedHeight }, style]}
    >
      <Image
        source={isHorizontal ? logoHorizontal : logoComplete}
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
