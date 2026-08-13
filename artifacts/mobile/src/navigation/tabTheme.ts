import type { LegacyColorPalette } from '@/src/theme';

export function createNativeTabTheme(colors: LegacyColorPalette) {
  return {
    tintColor: colors.primary,
    iconColor: {
      selected: colors.primary,
      default: colors.mutedForeground,
    },
    labelStyle: {
      selected: { color: colors.primary },
      default: { color: colors.mutedForeground },
    },
  };
}

export function createTabScreenOptions(colors: LegacyColorPalette) {
  return {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.mutedForeground,
  };
}
