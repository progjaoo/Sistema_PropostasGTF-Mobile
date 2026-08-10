import { z } from 'zod';

const proposalStatuses = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'ARCHIVED'] as const;
const proposalTimelineSteps = [
  'LEAD_CREATED',
  'IN_CONVERSATION',
  'PROPOSAL_SENT',
  'CLIENT_REVIEWING',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
] as const;
const proposalProductSeasonalities = ['MONTHLY', 'SEMIANNUAL', 'ANNUAL'] as const;

export const proposalStatusSchema = z.preprocess(
  (value) => (proposalStatuses.includes(value as any) ? value : 'DRAFT'),
  z.enum(proposalStatuses),
);
export const proposalTimelineStepSchema = z.preprocess(
  (value) => (proposalTimelineSteps.includes(value as any) ? value : 'IN_CONVERSATION'),
  z.enum(proposalTimelineSteps),
);
const proposalProductSeasonalitySchema = z.preprocess(
  (value) => (proposalProductSeasonalities.includes(value as any) ? value : null),
  z.enum(proposalProductSeasonalities).nullable(),
).transform((value) => value ?? undefined).nullish();

const displayString = (fallback: string) =>
  z.union([z.string(), z.number(), z.boolean()]).nullish().transform((value) => String(value ?? '').trim() || fallback);
const nullableDisplayString = z.union([z.string(), z.number(), z.boolean()]).nullish().transform((value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
});

export const proposalProductSchema = z.object({
  id: z.string(),
  order: z.number(),
  qty: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  detail: z.string().nullish(),
  program: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  color: z.string().default('BLUE'),
  productTemplateId: z.string().nullish(),
  durationId: z.string().nullish(),
  durationLabel: z.string().nullish(),
  airTime: z.string().nullish(),
  seasonality: proposalProductSeasonalitySchema,
});

export const leadSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  active: z.boolean(),
  order: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const leadMetricsSchema = z.object({
  totals: z.object({
    captured: z.number(),
    open: z.number(),
    converted: z.number(),
    conversionRate: z.number(),
  }),
  bySource: z.array(
    z.object({
      leadSourceId: z.string().nullable(),
      name: z.string(),
      captured: z.number(),
      open: z.number(),
      converted: z.number(),
      conversionRate: z.number(),
    }),
  ),
});

const progressBoardProposalSchema = z.object({
  id: z.string(),
  status: proposalStatusSchema,
  currentStep: proposalTimelineStepSchema,
  proposalTypeName: displayString('Proposta comercial'),
  advertiserName: z.string().nullish(),
  stationName: z.string().nullish(),
  createdByName: displayString('Sem responsavel'),
  updatedAt: z.string().optional(),
  investValue: z.string().nullish(),
  products: z.array(
    z.object({
      id: z.string(),
      title: displayString('Produto sem nome'),
      qty: displayString('01'),
      airTime: z.string().nullish(),
      durationLabel: z.string().nullish(),
      seasonality: proposalProductSeasonalitySchema,
    }).passthrough(),
  ),
}).passthrough();

export const proposalProgressBoardSchema = z.object({
  programs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      stationId: z.string().nullish(),
      stationName: z.string().nullish(),
      proposals: z.array(progressBoardProposalSchema),
    }).passthrough(),
  ),
});

export const proposalProgramBoardSchema = z.object({
  programs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string().nullish(),
      description: z.string().nullish(),
      icon: z.string().nullish(),
      stationId: z.string().nullish(),
      stationName: z.string().nullish(),
      primaryColor: z.string().nullish(),
      products: z.array(
        z.object({
          id: z.string(),
          title: displayString('Produto sem nome'),
          description: nullableDisplayString,
          stationId: z.string().nullish(),
          stationName: z.string().nullish(),
          durationLabel: z.string().nullish(),
          suggestedValueMin: z.string().nullish(),
        }).passthrough(),
      ).default([]),
      proposals: z.array(
        z.object({
          id: z.string(),
          status: proposalStatusSchema,
          advertiserId: z.string().nullish(),
          advertiserName: z.string().nullish(),
          stationName: z.string().nullish(),
          proposalTypeName: displayString('Proposta comercial'),
          createdByName: displayString('Sem responsavel'),
          investValue: z.string().nullish(),
          updatedAt: z.string().optional(),
          products: z.array(
            z.object({
              id: z.string(),
              title: displayString('Produto sem nome'),
              qty: displayString('01'),
              airTime: z.string().nullish(),
              durationLabel: z.string().nullish(),
              seasonality: proposalProductSeasonalitySchema,
              programName: z.string().nullish(),
            }).passthrough(),
          ),
        }).passthrough(),
      ).default([]),
    }).passthrough(),
  ),
});

export const advertiserLinkedProposalSchema = z.object({
  id: z.string(),
  propType: z.string().nullable(),
  investValue: z.string().nullable(),
  status: proposalStatusSchema,
  programName: z.string(),
  createdById: z.string(),
  createdByName: z.string(),
  viewerCanEdit: z.boolean(),
  updatedAt: z.string(),
});

export const advertiserWithProposalsSchema = z.object({
  id: z.string(),
  tradeName: z.string(),
  legalName: z.string().nullish(),
  cnpj: z.string().nullish(),
  logoBase64: z.string().nullish(),
  segment: z.string().nullish(),
  contactName: z.string().nullish(),
  contactPhone: z.string().nullish(),
  contactEmail: z.string().nullish(),
  notes: z.string().nullish(),
  active: z.boolean(),
  status: z.enum(['LEAD', 'CLIENT']).optional(),
  leadSourceId: z.string().nullish(),
  leadSource: leadSourceSchema.nullish(),
  createdAt: z.string(),
  proposals: z.array(advertiserLinkedProposalSchema).default([]),
});
