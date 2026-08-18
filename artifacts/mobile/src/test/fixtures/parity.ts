import type { AuthUser, Advertiser, ProductTemplate, Proposal, Station } from '@/src/types';
import type {
  AdvertiserWithProposals,
  CommercialContract,
  CommercialContractForecastResponse,
  CommercialContractSummary,
  StationProposalBoard,
  StationDeletionImpact,
} from '@/src/api/contracts';

export const makeUser = (patch: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1', name: 'Ana', email: 'ana@example.com', role: 'COMERCIAL', active: true,
  createdAt: '2026-08-01T00:00:00.000Z', ...patch,
});

export const makeStation = (patch: Partial<Station> = {}): Station => ({
  id: 'station-1', name: 'Rádio Centro', primaryColor: '#427EFF', active: true,
  usesPrograms: true, createdAt: '2026-08-01T00:00:00.000Z', ...patch,
});

export const makeAdvertiser = (patch: Partial<Advertiser> = {}): Advertiser => ({
  id: 'advertiser-1', tradeName: 'Cliente Centro', active: true, status: 'LEAD',
  createdAt: '2026-08-01T00:00:00.000Z', ...patch,
});

export const makeProposal = (patch: Partial<Proposal> = {}): Proposal => ({
  id: 'proposal-1', stationId: 'station-1', station: makeStation(), advertiserId: 'advertiser-1',
  advertiser: makeAdvertiser(), createdById: 'user-1', createdBy: makeUser(), status: 'DRAFT',
  propType: 'Comercial', propMonth: '08', propYear: '2026', showPeriod: true, overlayOpacity: 0,
  stats: [], products: [], createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  viewerCanEdit: true, ...patch,
});

export const stationFixture = makeStation();
export const impactFixture: StationDeletionImpact = {
  stationId: stationFixture.id,
  canDelete: false,
  blockers: { proposals: 2, referencedProposalProducts: 1 },
  removable: { products: 4, programs: 2, proposalTemplates: 1, presentationItems: 4, userAccesses: 3 },
};
export const admin = makeUser({ id: 'admin-1', role: 'ADMIN' });
export const sellerA = makeUser({ id: 'seller-a' });
export const sellerB = makeUser({ id: 'seller-b', name: 'Bruno', email: 'bruno@example.com' });
export const sellerAProposal = makeProposal({ createdById: sellerA.id, createdBy: sellerA });
export const sellerBProposal = makeProposal({ id: 'proposal-b', createdById: sellerB.id, createdBy: sellerB });
export const olderProposal = makeProposal({ investValue: '100.00' });
export const newerProposal = makeProposal({ investValue: '200.00' });

export const stationBoardFixture: StationProposalBoard = {
  stations: [{
    id: stationFixture.id, name: stationFixture.name, primaryColor: stationFixture.primaryColor,
    usesPrograms: stationFixture.usesPrograms ?? true, proposalCount: 1, investmentTotal: 100,
    proposals: [{
      id: sellerAProposal.id, status: sellerAProposal.status, statusLabel: 'Em conversa',
      advertiserId: sellerAProposal.advertiserId, advertiserName: sellerAProposal.advertiser!.tradeName,
      advertiserStatus: sellerAProposal.advertiser?.status ?? null, proposalTypeName: sellerAProposal.propType,
      createdByName: sellerA.name, investValue: sellerAProposal.investValue ?? null,
      updatedAt: sellerAProposal.updatedAt, currentStep: 'IN_CONVERSATION', currentStepLabel: 'Em conversa',
      programNames: ['Jornal', 'Esporte'], products: [],
    }],
  }],
};

export const leadFixture: AdvertiserWithProposals = { ...makeAdvertiser(), proposals: [] };
export const clientFixture: AdvertiserWithProposals = { ...makeAdvertiser({ id: 'client-1', status: 'CLIENT' }), proposals: [] };
export const allowedStation = makeStation({ viewerCanViewCatalog: true });
export const productFixture: ProductTemplate = {
  id: 'product-1', stationId: allowedStation.id, title: 'Spot 30s', color: 'BLUE', suggestedValue: '1500.00',
  durationLabel: '30 segundos', active: true, createdAt: '2026-08-01T00:00:00.000Z',
};
export const ownContract: CommercialContract = {
  id: 'contract-1', ownerId: sellerA.id, ownerName: sellerA.name, advertiserId: clientFixture.id,
  advertiserName: clientFixture.tradeName, proposalId: sellerAProposal.id, proposalName: 'Proposta agosto',
  stationName: stationFixture.name, monthlyValue: '2500.00', saleDate: '2026-08-10', startDate: '2026-09-01',
  endDate: '2027-08-31', installmentDueDay: 10, status: 'ACTIVE', createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
};
export const summaryFixture: CommercialContractSummary = {
  month: '2026-08', soldThisMonth: '2500.00', expectedRevenue: '2500.00', activeContracts: 1, endingIn30Days: 0,
};
export const forecastFixture: CommercialContractForecastResponse = {
  from: '2026-08', months: 2,
  data: [{ month: '2026-08', expectedRevenue: '2500.00' }, { month: '2026-09', expectedRevenue: '2500.00' }],
};
