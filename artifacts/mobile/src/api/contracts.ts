import type {
  Advertiser,
  ProposalProduct,
  ProposalStatus,
  ProposalTimelineStep,
} from '@/src/types';

export interface LeadSource {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadMetricBySource {
  leadSourceId: string | null;
  name: string;
  captured: number;
  open: number;
  converted: number;
  conversionRate: number;
}

export interface LeadMetrics {
  totals: {
    captured: number;
    open: number;
    converted: number;
    conversionRate: number;
  };
  bySource: LeadMetricBySource[];
}

export interface ProgressBoardProposal {
  id: string;
  status: ProposalStatus;
  currentStep: ProposalTimelineStep;
  viewerCanEdit: boolean;
  stationId?: string | null;
  proposalTypeName: string;
  advertiserName?: string | null;
  primaryColor?: string | null;
  stationName?: string | null;
  createdByName: string;
  updatedAt?: string;
  investValue?: string | null;
  products: Array<Pick<ProposalProduct, 'id' | 'title' | 'qty' | 'airTime' | 'durationLabel' | 'seasonality'>>;
}

export interface ProgressBoardProgram {
  id: string;
  name: string;
  stationId?: string | null;
  stationName?: string | null;
  proposals: ProgressBoardProposal[];
}

export interface ProposalProgressBoard {
  programs: ProgressBoardProgram[];
}

export interface StationDeletionImpact {
  stationId: string;
  canDelete: boolean;
  blockers: { proposals: number; referencedProposalProducts: number };
  removable: {
    products: number;
    programs: number;
    proposalTemplates: number;
    presentationItems: number;
    userAccesses: number;
  };
}

export interface StationBoardProposal {
  id: string;
  status: ProposalStatus;
  statusLabel: string;
  advertiserId?: string | null;
  advertiserName: string;
  advertiserStatus?: 'LEAD' | 'CLIENT' | null;
  proposalTypeName: string;
  createdByName: string;
  investValue?: string | null;
  updatedAt: string;
  currentStep: ProposalTimelineStep;
  currentStepLabel: string;
  programNames: string[];
  products: Array<{
    id: string;
    title: string;
    qty: string;
    durationLabel?: string | null;
    airTime?: string | null;
    seasonality?: string | null;
    programName?: string | null;
  }>;
}

export interface StationProposalBoard {
  stations: Array<{
    id: string;
    name: string;
    primaryColor: string;
    usesPrograms: boolean;
    proposalCount: number;
    investmentTotal: number;
    proposals: StationBoardProposal[];
  }>;
}

export type CommercialContractStatus = 'ACTIVE' | 'CANCELLED';

export interface CommercialContract {
  id: string;
  ownerId: string;
  ownerName?: string | null;
  advertiserId: string;
  advertiserName?: string | null;
  proposalId: string;
  proposalName?: string | null;
  stationName?: string | null;
  monthlyValue: string;
  saleDate: string;
  startDate: string;
  endDate: string;
  installmentDueDay: number;
  status: CommercialContractStatus;
  cancelledAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialContractSummary {
  month: string;
  soldThisMonth: string;
  expectedRevenue: string;
  activeContracts: number;
  endingIn30Days: number;
}

export interface CommercialContractForecastResponse {
  from: string;
  months: number;
  data: Array<{ month: string; expectedRevenue: string }>;
}

export interface EligibleContractProposal {
  id: string;
  advertiserId?: string | null;
  advertiserName?: string | null;
  stationId?: string | null;
  stationName?: string | null;
  proposalName?: string | null;
  investValue?: string | null;
  status?: ProposalStatus;
}

export interface ProgramBoardProduct {
  id: string;
  title: string;
  description?: string | null;
  stationId?: string | null;
  stationName?: string | null;
  durationLabel?: string | null;
  suggestedValueMin?: string | null;
}

export interface ProgramBoardProposal {
  id: string;
  status: ProposalStatus;
  advertiserId?: string | null;
  advertiserName?: string | null;
  stationName?: string | null;
  proposalTypeName: string;
  createdByName: string;
  investValue?: string | null;
  updatedAt?: string;
  products: Array<Pick<ProposalProduct, 'id' | 'title' | 'qty' | 'airTime' | 'durationLabel' | 'seasonality'> & {
    programName?: string | null;
  }>;
}

export interface ProposalProgramBoardProgram {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  icon?: string | null;
  stationId?: string | null;
  stationName?: string | null;
  primaryColor?: string | null;
  products: ProgramBoardProduct[];
  proposals: ProgramBoardProposal[];
}

export interface ProposalProgramBoard {
  programs: ProposalProgramBoardProgram[];
}

export interface AdvertiserLinkedProposal {
  id: string;
  propType: string | null;
  investValue: string | null;
  status: ProposalStatus;
  programName: string;
  createdById: string;
  createdByName: string;
  viewerCanEdit: boolean;
  updatedAt: string;
}

export interface AdvertiserWithProposals extends Advertiser {
  ownerId?: string | null;
  owner?: Pick<import('@/src/types').AuthUser, 'id' | 'name' | 'email'> | null;
  viewerCanEdit?: boolean;
  leadSourceId?: string | null;
  leadSource?: LeadSource | null;
  proposals: AdvertiserLinkedProposal[];
}
