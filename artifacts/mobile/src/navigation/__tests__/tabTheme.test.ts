import colors from '@/constants/colors';

import { createNativeTabTheme, createTabScreenOptions } from '../tabTheme';

describe('Mosaico tab theme', () => {
  it('uses the institutional orange as selected tab color in native and classic tabs', () => {
    expect(createNativeTabTheme(colors.light)).toMatchObject({
      tintColor: '#F25017',
      iconColor: { selected: '#F25017' },
      labelStyle: { selected: { color: '#F25017' } },
    });

    expect(createTabScreenOptions(colors.light).tabBarActiveTintColor).toBe('#F25017');
  });
});
