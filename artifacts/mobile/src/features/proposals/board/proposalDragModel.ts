/**
 * Converts a horizontal long-press drag into a destination stage index.
 * A card only changes stage after crossing a deliberate threshold, keeping
 * normal taps and vertical scrolling from accidentally moving proposals.
 */
export function getDragTargetIndex(
  startIndex: number,
  translationX: number,
  stageWidth: number,
  count: number,
): number | null {
  if (count <= 0 || startIndex < 0 || startIndex >= count) return null;
  const threshold = Math.max(72, stageWidth * 0.28);
  if (Math.abs(translationX) < threshold) return null;

  const stageDistance = Math.max(stageWidth * 0.65, 1);
  const delta = Math.round(translationX / stageDistance);
  const target = Math.max(0, Math.min(count - 1, startIndex + delta));
  return target === startIndex ? null : target;
}
