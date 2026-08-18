import { getDragTargetIndex } from '../proposalDragModel';

describe('proposal drag model', () => {
  it('returns the next stage after a meaningful right drag', () => {
    expect(getDragTargetIndex(1, 220, 320, 7)).toBe(2);
  });

  it('returns the previous stage after a meaningful left drag', () => {
    expect(getDragTargetIndex(3, -220, 320, 7)).toBe(2);
  });

  it('ignores short drags and clamps at the board edges', () => {
    expect(getDragTargetIndex(1, 24, 320, 7)).toBeNull();
    expect(getDragTargetIndex(0, -900, 320, 7)).toBeNull();
    expect(getDragTargetIndex(6, 900, 320, 7)).toBeNull();
  });
});
