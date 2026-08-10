export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  heading: {
    xl: {
      fontFamily: fontFamilies.extraBold,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
    },
    lg: {
      fontFamily: fontFamilies.bold,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
    },
    md: {
      fontFamily: fontFamilies.semiBold,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
    },
    sm: {
      fontFamily: fontFamilies.semiBold,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600',
    },
  },
  body: {
    lg: {
      fontFamily: fontFamilies.regular,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
    },
    md: {
      fontFamily: fontFamilies.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
    },
    sm: {
      fontFamily: fontFamilies.regular,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
    },
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
} as const;

export type TypographyToken = typeof typography;
