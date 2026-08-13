import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

const definePalette = <T extends Record<string, string>>(palette: T) =>
  palette as { readonly [Key in keyof T]: string };

export const legacyLightColors = definePalette({
  text: '#0F172A',
  tint: '#F25017',
  background: '#F8F9FC',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',
  primary: '#F25017',
  primaryLight: '#FF6B2B',
  primaryForeground: '#FFFFFF',
  secondary: '#E2E8F0',
  secondaryForeground: '#334155',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  accent: '#FFF1EB',
  accentForeground: '#D6440F',
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  danger: '#DC2626',
  dangerForeground: '#FFFFFF',
  success: '#16A34A',
  successForeground: '#FFFFFF',
  warning: '#D97706',
  warningForeground: '#FFFFFF',
  info: '#0284C7',
  infoForeground: '#FFFFFF',
  border: '#E2E8F0',
  input: '#E2E8F0',
  draft: '#64748B',
  sent: '#0284C7',
  approved: '#16A34A',
  rejected: '#DC2626',
  archived: '#94A3B8',
});

export const legacyDarkColors: typeof legacyLightColors = {
  text: '#F8FAFC',
  tint: '#FF6B2B',
  background: '#080B12',
  foreground: '#F8FAFC',
  card: '#111827',
  cardForeground: '#F8FAFC',
  primary: '#FF6B2B',
  primaryLight: '#FF8A5C',
  primaryForeground: '#FFFFFF',
  secondary: '#243042',
  secondaryForeground: '#D7DEE8',
  muted: '#1A2232',
  mutedForeground: '#A2AEC2',
  accent: '#35170D',
  accentForeground: '#FFB394',
  destructive: '#F87171',
  destructiveForeground: '#260707',
  danger: '#F87171',
  dangerForeground: '#260707',
  success: '#4ADE80',
  successForeground: '#052E16',
  warning: '#FBBF24',
  warningForeground: '#2B1900',
  info: '#38BDF8',
  infoForeground: '#082F49',
  border: '#283449',
  input: '#334155',
  draft: '#94A3B8',
  sent: '#38BDF8',
  approved: '#4ADE80',
  rejected: '#F87171',
  archived: '#64748B',
};

const semanticLight = {
  brand: {
    primary: legacyLightColors.primary,
    primarySoft: legacyLightColors.accent,
    primaryStrong: '#D6440F',
    primaryForeground: legacyLightColors.primaryForeground,
    secondary: '#0F172A',
    accent: legacyLightColors.accent,
  },
  surface: {
    background: legacyLightColors.background,
    card: legacyLightColors.card,
    elevated: '#FFFFFF',
    muted: legacyLightColors.muted,
    border: legacyLightColors.border,
    input: legacyLightColors.input,
  },
  text: {
    primary: legacyLightColors.foreground,
    secondary: legacyLightColors.secondaryForeground,
    muted: legacyLightColors.mutedForeground,
    inverse: '#FFFFFF',
  },
  status: {
    draft: legacyLightColors.draft,
    sent: legacyLightColors.sent,
    approved: legacyLightColors.approved,
    rejected: legacyLightColors.rejected,
    archived: legacyLightColors.archived,
    warning: legacyLightColors.warning,
    info: legacyLightColors.info,
  },
} as const;

const semanticDark = {
  brand: {
    primary: legacyDarkColors.primary,
    primarySoft: legacyDarkColors.accent,
    primaryStrong: '#FF8A5C',
    primaryForeground: legacyDarkColors.primaryForeground,
    secondary: '#E5E7EB',
    accent: legacyDarkColors.accent,
  },
  surface: {
    background: legacyDarkColors.background,
    card: legacyDarkColors.card,
    elevated: '#172033',
    muted: legacyDarkColors.muted,
    border: legacyDarkColors.border,
    input: legacyDarkColors.input,
  },
  text: {
    primary: legacyDarkColors.foreground,
    secondary: legacyDarkColors.secondaryForeground,
    muted: legacyDarkColors.mutedForeground,
    inverse: '#07111F',
  },
  status: {
    draft: legacyDarkColors.draft,
    sent: legacyDarkColors.sent,
    approved: legacyDarkColors.approved,
    rejected: legacyDarkColors.rejected,
    archived: legacyDarkColors.archived,
    warning: legacyDarkColors.warning,
    info: legacyDarkColors.info,
  },
} as const;

export const tokens = {
  colors: {
    light: {
      ...semanticLight,
      legacy: legacyLightColors,
    },
    dark: {
      ...semanticDark,
      legacy: legacyDarkColors,
    },
  },
  spacing,
  typography,
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 999,
  },
  shadows,
  motion: {
    fast: 140,
    normal: 220,
    slow: 320,
  },
} as const;

export type LegacyColorPalette = typeof legacyLightColors;
export type ThemeName = keyof typeof tokens.colors;
