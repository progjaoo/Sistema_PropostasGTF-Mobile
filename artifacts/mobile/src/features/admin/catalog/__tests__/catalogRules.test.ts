import { canManagePrograms, normalizeProductProgram } from '../catalogRules';

describe('catalog station rules', () => {
  it('hides program management when a station does not use programs', () => {
    expect(canManagePrograms({ usesPrograms: false })).toBe(false);
    expect(normalizeProductProgram({ usesPrograms: false }, 'program-1')).toBeNull();
    expect(normalizeProductProgram({ usesPrograms: true }, 'program-1')).toBe('program-1');
  });
});
