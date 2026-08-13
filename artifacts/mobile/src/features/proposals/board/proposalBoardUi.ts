import { spacing, tokens } from '@/src/theme';

export function getNewProposalActionStyle() {
  return {
    minHeight: 46,
    paddingHorizontal: Math.max(spacing.md, 14),
    borderRadius: tokens.radius.xl,
  };
}
