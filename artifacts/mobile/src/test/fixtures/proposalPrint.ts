import type { Proposal, ProposalProduct } from '@/src/types';

export function makePrintProduct(index: number, overrides: Partial<ProposalProduct> = {}): ProposalProduct {
  return {
    id: `product-${index}`,
    order: index,
    qty: String(index),
    title: `Produto ${index}`,
    description: `Descricao comercial do produto ${index}.`,
    detail: `Informacao interna ${index}.`,
    program: index % 2 === 0 ? 'Show da Manha' : 'Rotativo Comercial',
    color: 'BLUE',
    durationLabel: index % 2 === 0 ? '30s' : null,
    airTime: index % 3 === 0 ? '09h as 12h' : null,
    seasonality: index % 4 === 0 ? 'MONTHLY' : null,
    ...overrides,
  };
}

export function makePrintProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 'proposal-lead-recaptura',
    stationId: 'station-radio-88',
    station: {
      id: 'station-radio-88',
      name: 'Radio 88 FM',
      slogan: 'A mais ouvida da cidade',
      primaryColor: '#427EFF',
      logoBase64: 'data:image/png;base64,aGVsbG8=',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    advertiserId: 'advertiser-recaptura',
    advertiser: {
      id: 'advertiser-recaptura',
      tradeName: 'Lead Recaptura 10 Meses',
      legalName: 'Lead Recaptura LTDA',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    createdById: 'user-leonardo',
    createdBy: {
      id: 'user-leonardo',
      name: 'Leonardo Salles',
      email: 'leonardo@example.com',
      role: 'ADMIN',
      active: true,
      jobTitle: 'Administrador Geral',
      contactPhone: '(24) 99823-3070',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    status: 'DRAFT',
    propType: 'Pacote Promocional',
    proposalTypeName: 'Pacote Promocional',
    periodicity: 'MONTHLY',
    propMonth: 'Janeiro',
    propYear: '2026',
    dateStart: '2026-01-05',
    dateEnd: '2026-02-06',
    showPeriod: true,
    overlayOpacity: 0,
    stats: [
      { num: '34,5', suf: '%', desc: 'Audiencia mensal' },
      { num: '50', suf: '%', desc: 'Publico que ouve radio' },
      { num: '31', suf: '%', desc: 'Audiencia total no Sul Fluminense' },
      { num: '5', suf: '%', desc: 'Engajamento online' },
    ],
    investDesc: 'Valor final',
    investValue: '15000.00',
    contactName: 'Contato legado',
    contactRole: 'Cargo legado',
    contactPhone: '(00) 00000-0000',
    products: [
      makePrintProduct(1, { qty: '08', title: 'Spot 30 segundos' }),
      makePrintProduct(2, { qty: '01', title: 'Patrocinio de quadro' }),
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

