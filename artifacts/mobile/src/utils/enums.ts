import { ProposalStatus, ProposalTimelineStep, ProposalRecallReminderStatus, AdvertiserStatus } from '@/src/types';

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  APPROVED: 'Aceita',
  REJECTED: 'Rejeitada',
  ARCHIVED: 'Arquivada',
};

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  DRAFT: '#64748B',
  SENT: '#0284C7',
  APPROVED: '#16A34A',
  REJECTED: '#DC2626',
  ARCHIVED: '#71717A',
};

export const TIMELINE_STEP_LABELS: Record<ProposalTimelineStep, string> = {
  LEAD_CREATED: 'Lead criado',
  IN_CONVERSATION: 'Em conversa',
  PROPOSAL_SENT: 'Proposta enviada',
  CLIENT_REVIEWING: 'Cliente analisando',
  NEGOTIATION: 'Negociação',
  APPROVED: 'Aceita',
  REJECTED: 'Rejeitada',
};

export const RECALL_STATUS_LABELS: Record<ProposalRecallReminderStatus, string> = {
  PENDING: 'Pendente',
  NOTIFIED: 'Notificado',
  SNOOZED: 'Adiado',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const ADVERTISER_STATUS_LABELS: Record<AdvertiserStatus, string> = {
  LEAD: 'Lead',
  CLIENT: 'Cliente',
};

export const MILESTONE_LABELS: Record<number, string> = {
  3: '3 meses',
  6: '6 meses',
  10: '10 meses',
};
