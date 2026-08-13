import appConfig from '../../../app.json';

describe('Expo app identity metadata', () => {
  it('uses Mosaico visible identity while preserving app identifiers', () => {
    expect(appConfig.expo.name).toBe('Mosaico Propostas');
    expect(appConfig.expo.icon).toBe('./assets/images/mosaico-icon.png');
    expect(appConfig.expo.splash?.image).toBe('./assets/images/mosaico-splash.png');
    expect(appConfig.expo.splash?.backgroundColor).toBe('#F25017');
    expect(appConfig.expo.web?.favicon).toBe('./assets/images/mosaico-icon.png');

    expect(appConfig.expo.slug).toBe('mobile');
    expect(appConfig.expo.scheme).toBe('gtfpropostas');
    expect(appConfig.expo.ios?.bundleIdentifier).toBe('br.com.grupogtf.propostas');
    expect(appConfig.expo.android?.package).toBe('br.com.grupogtf.propostas');
  });
});
