import { makePrintProposal, makePrintProduct } from '@/src/test/fixtures/proposalPrint';
import { mapProposalToPrintData } from '../proposalPrintModel';

describe('mapProposalToPrintData', () => {
  it('normalizes proposal content using the same priorities as the web PDF', () => {
    const data = mapProposalToPrintData(makePrintProposal());

    expect(data.primaryColor).toBe('#427EFF');
    expect(data.stationName).toBe('Radio 88 FM');
    expect(data.clientName).toBe('Lead Recaptura 10 Meses');
    expect(data.proposalTypeName).toBe('Pacote Promocional');
    expect(data.periodLabel).toBe('05/01/2026 a 06/02/2026');
    expect(data.investmentValue).toBe('R$ 15.000,00');
    expect(data.sellerName).toBe('Leonardo Salles');
    expect(data.sellerRole).toBe('Administrador Geral');
    expect(data.sellerPhone).toBe('(24) 99823-3070');
    expect(data.products[0]).toMatchObject({
      quantity: '08',
      title: 'Spot 30 segundos',
      programName: 'Rotativo Comercial',
    });
  });

  it.each([
    ['15000.00', 'R$ 15.000,00'],
    ['15.000,00', 'R$ 15.000,00'],
    ['R$ 15.000,00', 'R$ 15.000,00'],
  ])('formats %s as BRL', (input, expected) => {
    const data = mapProposalToPrintData(makePrintProposal({ investValue: input }));
    expect(data.investmentValue).toBe(expected);
  });

  it('uses safe fallbacks and hides the period when requested', () => {
    const data = mapProposalToPrintData(makePrintProposal({
      showPeriod: false,
      propType: 'Legado',
      proposalTypeName: 'Tipo atual',
      station: { ...makePrintProposal().station!, primaryColor: 'orange', logoBase64: 'https://invalid/logo.png' },
      createdBy: undefined,
      products: [makePrintProduct(1, {
        qty: '1',
        durationLabel: '60 segundos',
        airTime: 'Diariamente',
        seasonality: 'MONTHLY',
      })],
    }));

    expect(data.primaryColor).toBe('#427EFF');
    expect(data.stationLogoDataUrl).toBeNull();
    expect(data.showPeriod).toBe(false);
    expect(data.periodLabel).toBe('');
    expect(data.proposalTypeName).toBe('Tipo atual');
    expect(data.sellerName).toBe('Contato legado');
    expect(data.products[0].quantity).toBe('01');
    expect(data.products[0].metadata).toBe('60 segundos - Diariamente - Mensal');
  });

  it('translates periodicity when dates are absent and accepts an embedded SVG logo', () => {
    const svgLogo = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
    const data = mapProposalToPrintData(makePrintProposal({
      dateStart: undefined,
      dateEnd: undefined,
      periodicity: 'SEMIANNUAL',
      station: { ...makePrintProposal().station!, logoBase64: svgLogo },
    }));

    expect(data.periodLabel).toBe('Semestral');
    expect(data.stationLogoDataUrl).toBe(svgLogo);
  });
});
