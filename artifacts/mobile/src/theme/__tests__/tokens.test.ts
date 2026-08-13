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

  it('uses the Mosaico institutional palette without changing status semantics', () => {
    expect(colors.light.tint).toBe('#F25017');
    expect(colors.light.primary).toBe('#F25017');
    expect(colors.light.primaryLight).toBe('#FF6B2B');
    expect(colors.light.primaryForeground).toBe('#FFFFFF');
    expect(colors.light.accent).toBe('#FFF1EB');
    expect(colors.light.accentForeground).toBe('#D6440F');
    expect(tokens.colors.light.brand.primaryStrong).toBe('#D6440F');

    expect(colors.dark.tint).toBe('#FF6B2B');
    expect(colors.dark.primary).toBe('#FF6B2B');
    expect(colors.dark.primaryLight).toBe('#FF8A5C');
    expect(colors.dark.primaryForeground).toBe('#FFFFFF');
    expect(colors.dark.accent).toBe('#35170D');
    expect(colors.dark.accentForeground).toBe('#FFB394');
    expect(tokens.colors.dark.brand.primaryStrong).toBe('#FF8A5C');

    expect(colors.light.success).toBe('#16A34A');
    expect(colors.light.warning).toBe('#D97706');
    expect(colors.light.destructive).toBe('#DC2626');
    expect(colors.light.approved).toBe('#16A34A');
    expect(colors.light.rejected).toBe('#DC2626');
    expect(colors.light.info).toBe('#0284C7');
  });
});
