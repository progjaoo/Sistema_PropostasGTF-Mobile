export const shadows = {
  none: {
    boxShadow: 'none',
  },
  sm: {
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
  },
  md: {
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.10)',
  },
  lg: {
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
  },
} as const;

export type ShadowToken = keyof typeof shadows;
