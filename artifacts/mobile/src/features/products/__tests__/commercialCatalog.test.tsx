import React from 'react';
import { render } from '@testing-library/react-native';
import { CommercialProductCatalog } from '../CommercialProductCatalog';

const station = { id: 'station-1', name: 'Rádio Centro', primaryColor: '#2563EB', active: true, usesPrograms: true, viewerCanViewCatalog: true, createdAt: '2026-01-01' };
const product = { id: 'product-1', stationId: station.id, stationName: station.name, title: 'Spot 30s', active: true, color: 'BLUE', suggestedValue: '1500.00', durationLabel: '30s', createdAt: '2026-01-01' };

describe('commercial product catalog', () => {
  it('renders allowed products without administrative commands', () => {
    const screen = render(<CommercialProductCatalog stations={[station]} products={[product]} loading={false} error={null} onRetry={jest.fn()} />);
    expect(screen.getByText(product.title)).toBeTruthy();
    expect(screen.queryByText('Editar')).toBeNull();
    expect(screen.queryByText('Excluir')).toBeNull();
  });

  it('does not show a program label for a station without programs', () => {
    const screen = render(<CommercialProductCatalog stations={[{ ...station, usesPrograms: false }]} products={[{ ...product, programName: 'Programa X' }]} loading={false} error={null} onRetry={jest.fn()} />);
    expect(screen.queryByText('Programa X')).toBeNull();
    expect(screen.getByText('Produtos da empresa')).toBeTruthy();
  });
});
