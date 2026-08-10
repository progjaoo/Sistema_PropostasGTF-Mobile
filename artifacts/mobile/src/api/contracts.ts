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
  proposalTypeName: string;
  advertiserName?: string | null;
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
  leadSourceId?: string | null;
  leadSource?: LeadSource | null;
  proposals: AdvertiserLinkedProposal[];
}
