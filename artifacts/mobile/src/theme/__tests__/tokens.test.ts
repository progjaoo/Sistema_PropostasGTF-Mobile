import colors from '@/constants/colors';
import { getColorsForScheme } from '@/hooks/useColors';
import { shadows, spacing, tokens, typography } from '@/src/theme';

const legacyColorKeys = [
  'text',
  'tint',
  'background',
  'foreground',
  'card',
  'cardForeground',
  'primary',
  'primaryLight',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'danger',
  'dangerForeground',
  'success',
  'successForeground',
  'warning',
  'warningForeground',
  'info',
  'infoForeground',
  'border',
  'input',
  'draft',
  'sent',
  'approved',
  'rejected',
  'archived',
] as const;

describe('mobile design tokens', () => {
  it('preserves every legacy color key in light and dark palettes', () => {
    for (const key of legacyColorKeys) {
      expect(colors.light[key]).toEqual(expect.any(String));
      expect(colors.dark[key]).toEqual(expect.any(String));
    }

    expect(colors.radius).toBe(8);
  });

  it('exposes semantic tokens, spacing, typography and shadows from one entrypoint', () => {
    expect(tokens.colors.light.brand.primary).toBe(colors.light.primary);
    expect(tokens.colors.dark.brand.primary).toBe(colors.dark.primary);
    expect(spacing.lg).toBe(16);
    expect(typography.heading.xl.fontWeight).toBe('800');
    expect(shadows.md.boxShadow).toContain('rgba');
  });

  it('returns the light palette with radius when the requested theme is light', () => {
    const result = getColorsForScheme('light');

    expect(result.primary).toBe(colors.light.primary);
    expect(result.background).toBe(colors.light.background);
    expect(result.radius).toBe(colors.radius);
  });

  it('returns the dark palette with radius when the requested theme is dark', () => {
    const result = getColorsForScheme('dark');

    expect(result.primary).toBe(colors.dark.primary);
    expect(result.background).toBe(colors.dark.background);
    expect(result.radius).toBe(colors.radius);
  });
});
