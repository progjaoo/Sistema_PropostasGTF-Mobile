describe('Mosaico brand contract', () => {
  it('centralizes the approved product identity and local assets', () => {
    let brand:
      | {
          name: string;
          productName: string;
          systemName: string;
          accessibilityLabel: string;
          assets: { icon: unknown; logo: unknown };
        }
      | undefined;

    try {
      brand = require('../brand').BRAND;
    } catch {
      brand = undefined;
    }

    expect(brand).toBeDefined();
    expect(brand).toMatchObject({
      name: 'Mosaico',
      productName: 'Mosaico Propostas',
      systemName: 'Sistema Comercial Mosaico',
      accessibilityLabel: 'Mosaico Propostas',
    });
    expect(brand?.assets.icon).toBeDefined();
    expect(brand?.assets.logo).toBeDefined();
    expect(brand).not.toHaveProperty('transitionLabel');
  });
});
