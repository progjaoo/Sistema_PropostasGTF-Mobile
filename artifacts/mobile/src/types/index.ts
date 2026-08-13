export type UserRole = 'ADMIN' | 'COMERCIAL';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  jobTitle?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  avatarBase64?: string | null;
  createdAt: string;
}

export interface MobileAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type ProposalStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type AdvertiserStatus = 'LEAD' | 'CLIENT';
export type ProposalTimelineStep =
  | 'LEAD_CREATED'
  | 'IN_CONVERSATION'
  | 'PROPOSAL_SENT'
  | 'CLIENT_REVIEWING'
  | 'NEGOTIATION'
  | 'APPROVED'
  | 'REJECTED';
export type ProposalRecallReminderStatus = 'PENDING' | 'NOTIFIED' | 'SNOOZED' | 'DONE' | 'CANCELLED';

export interface Station {
  id: string;
  name: string;
  slogan?: string | null;
  primaryColor: string;
  logoBase64?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  city?: string | null;
  active: boolean;
  viewerCanCreateProposals?: boolean;
  viewerCanViewCatalog?: boolean;
  presentationItems?: StationPresentationItem[];
  createdAt: string;
}

export interface StationPresentationItem {
  id?: string;
  highlight: string;
  description: string;
  order: number;
  active?: boolean;
}

export interface Advertiser {
  id: string;
  tradeName: string;
  legalName?: string | null;
  cnpj?: string | null;
  logoBase64?: string | null;
  segment?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  active: boolean;
  status?: AdvertiserStatus;
  leadSourceId?: string | null;
  createdAt: string;
}

export interface StatBlock {
  num: string;
  suf: string;
  desc: string;
}

export interface ProposalProduct {
  id: string;
  order: number;
  qty: string;
  title: string;
  description?: string | null;
  detail?: string | null;
  program?: string | null;
  programName?: string | null;
  tags?: string[];
  color: string;
  productTemplateId?: string | null;
  durationId?: string | null;
  durationLabel?: string | null;
  airTime?: string | null;
  seasonality?: 'MONTHLY' | 'SEMIANNUAL' | 'ANNUAL' | null;
  suggestedValueMin?: string | null;
  suggestedValueMax?: string | null;
}

export interface ProposalType {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
}

export interface ProductDuration {
  id: string;
  label: string;
  seconds?: number | null;
  active?: boolean;
  order?: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTemplate {
  id: string;
  stationId: string;
  stationName?: string | null;
  programId?: string | null;
  name?: string | null;
  qty?: string;
  title: string;
  description?: string | null;
  detail?: string | null;
  program?: string | null;
  programName?: string | null;
  suggestedValue?: string | null;
  suggestedValueMin?: string | null;
  suggestedValueMax?: string | null;
  durationLabel?: string | null;
  durationId?: string | null;
  active?: boolean;
  tags?: string[];
  color: string;
  createdAt: string;
}

export interface ProposalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  stationId?: string;
  active: boolean;
  order: number;
  createdAt: string;
  templateCount?: number;
}

export interface ProposalTemplateProduct {
  id?: string;
  order: number;
  qty: string;
  title: string;
  description?: string | null;
  detail?: string | null;
  program?: string | null;
  tags?: string[];
  color?: string;
}

export interface ProposalTemplate {
  id: string;
  stationId: string;
  categoryId: string;
  category?: ProposalCategory | null;
  name: string;
  description?: string | null;
  active: boolean;
  propType: string;
  campTag?: string | null;
  periodDesc?: string | null;
  investDesc?: string | null;
  stats?: StatBlock[];
  overlayOpacity?: number;
  usageCount?: number;
  products?: ProposalTemplateProduct[];
  createdAt: string;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  snapshot: unknown;
  createdAt: string;
  createdById?: string | null;
}

export interface Proposal {
  id: string;
  stationId: string;
  station?: Station;
  advertiserId?: string | null;
  advertiser?: Advertiser;
  createdById: string;
  createdBy?: Partial<AuthUser & { jobTitle?: string | null; contactPhone?: string | null; contactEmail?: string | null }>;
  status: ProposalStatus;
  propType: string;
  proposalTypeName?: string | null;
  periodicity?: string | null;
  propMonth: string;
  propYear: string;
  campTag?: string | null;
  clientLine1?: string | null;
  clientLine2?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  periodDesc?: string | null;
  showPeriod: boolean;
  bannerBase64?: string | null;
  overlayOpacity: number;
  stats: StatBlock[];
  investDesc?: string | null;
  investValue?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  contactPhone?: string | null;
  proposalTypeId?: string | null;
  products: ProposalProduct[];
  createdAt: string;
  updatedAt: string;
  viewerCanEdit?: boolean;
}

export interface ProposalSummary {
  id: string;
  status: ProposalStatus;
  propType: string;
  propMonth: string;
  propYear: string;
  campTag?: string | null;
  clientLine1?: string | null;
  advertiserName?: string | null;
  advertiserTradeName?: string | null;
  stationId: string;
  stationName?: string | null;
  fromTemplateName?: string | null;
  proposalTypeId?: string | null;
  proposalTypeName?: string | null;
  createdById: string;
  createdByName: string;
  investValue?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalListResponse {
  data: ProposalSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface ProposalTimeline {
  id: string;
  proposalId: string;
  step: ProposalTimelineStep;
  note?: string | null;
  createdById?: string | null;
  createdBy?: Partial<AuthUser>;
  createdAt: string;
}

export interface RecallReminder {
  id: string;
  proposalId: string;
  proposal?: Partial<Proposal>;
  advertiserId?: string | null;
  advertiser?: Partial<Advertiser> & { name?: string | null };
  assignedToId?: string | null;
  assignedTo?: Partial<AuthUser> | null;
  milestoneMonths: number;
  rejectedAt: string;
  dueAt: string;
  effectiveDueAt?: string;
  snoozedUntil?: string | null;
  status: ProposalRecallReminderStatus;
  statusLabel?: string;
  lastNotifiedAt?: string | null;
  handledAt?: string | null;
  handledBy?: Partial<AuthUser> | null;
  note?: string | null;
  createdAt?: string;
  stationName?: string | null;
  station?: Partial<Station> | null;
}

export interface RecallReminderListResponse {
  items?: RecallReminder[];
  data?: RecallReminder[];
  reminders?: RecallReminder[];
  meta?: {
    total?: number;
    due?: number;
  };
}

export interface RecallReminderCount {
  overdue: number;
  total: number;
}

export interface DashboardStats {
  total: number;
  draft: number;
  sent: number;
  approved: number;
  rejected: number;
  archived: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  jobTitle?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  avatarBase64?: string | null;
  createdAt: string;
  updatedAt?: string;
  stationAccesses?: UserStationAccess[];
}

export interface UserStationAccess {
  id?: string;
  stationId: string;
  stationName?: string;
  canCreateProposals: boolean;
  canViewCatalog: boolean;
  active: boolean;
}
