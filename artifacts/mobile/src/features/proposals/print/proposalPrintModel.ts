import type { Proposal } from '@/src/types';

const DEFAULT_PRIMARY_COLOR = '#427EFF';

const PERIODICITY_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual',
  ANNUAL: 'Anual',
};

const SEASONALITY_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

export type ProposalPrintProduct = {
  id: string;
  quantity: string;
  title: string;
  metadata: string;
  description: string;
  programName: string;
};

export type ProposalPrintData = {
  primaryColor: string;
  stationName: string;
  stationSlogan: string;
  stationLogoDataUrl: string | null;
  proposalTypeName: string;
  clientName: string;
  showPeriod: boolean;
  periodLabel: string;
  stats: Array<{ value: string; description: string }>;
  products: ProposalPrintProduct[];
  investmentDescription: string;
  investmentValue: string;
  sellerName: string;
  sellerRole: string;
  sellerPhone: string;
};

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function validPrimaryColor(value: unknown): string {
  const color = clean(value);
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : DEFAULT_PRIMARY_COLOR;
}

function validImageDataUrl(value: unknown): string | null {
  const dataUrl = clean(value);
  return /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(dataUrl) ? dataUrl : null;
}

function formatDateBR(value: unknown): string {
  const date = clean(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
}

function parseCurrency(value: unknown): number {
  let text = clean(value).replace(/R\$/gi, '').replace(/\s/g, '');
  if (!text) return 0;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  if (hasComma) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const pieces = text.split('.');
    if (pieces.length > 2 || pieces.at(-1)?.length === 3) text = pieces.join('');
  }

  const amount = Number(text.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrencyBRL(value: unknown): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseCurrency(value)).replace(/\u00a0/g, ' ');
}

function formatQuantity(value: unknown): string {
  const quantity = clean(value) || '01';
  return /^\d$/.test(quantity) ? quantity.padStart(2, '0') : quantity;
}

function resolvePeriod(proposal: Proposal): string {
  if (proposal.showPeriod === false) return '';
  const start = formatDateBR(proposal.dateStart);
  const end = formatDateBR(proposal.dateEnd);
  if (start || end) return [start || '00/00/0000', end || '00/00/0000'].join(' a ');
  return PERIODICITY_LABELS[clean(proposal.periodicity)] || clean(proposal.propMonth) || 'Mensal';
}

export function mapProposalToPrintData(proposal: Proposal): ProposalPrintData {
  const stationName = clean(proposal.station?.name) || 'Empresa';
  const seller = proposal.createdBy;

  return {
    primaryColor: validPrimaryColor(proposal.station?.primaryColor),
    stationName,
    stationSlogan: clean(proposal.station?.slogan) || 'Propostas comerciais',
    stationLogoDataUrl: validImageDataUrl(proposal.station?.logoBase64),
    proposalTypeName: clean(proposal.proposalTypeName) || clean(proposal.propType) || 'Proposta Comercial',
    clientName: clean(proposal.advertiser?.tradeName)
      || clean(proposal.advertiser?.legalName)
      || clean(proposal.clientLine1)
      || 'Nome do cliente',
    showPeriod: proposal.showPeriod !== false,
    periodLabel: resolvePeriod(proposal),
    stats: (proposal.stats ?? [])
      .slice(0, 4)
      .map((stat) => ({
        value: `${clean(stat.num)}${clean(stat.suf)}`,
        description: clean(stat.desc),
      }))
      .filter((stat) => stat.value || stat.description),
    products: (proposal.products ?? []).map((product, index) => ({
      id: clean(product.id) || `product-${index}`,
      quantity: formatQuantity(product.qty),
      title: clean(product.title) || 'Produto',
      metadata: [
        clean(product.durationLabel),
        clean(product.airTime),
        SEASONALITY_LABELS[clean(product.seasonality)] || clean(product.seasonality),
      ].filter(Boolean).join(' - '),
      description: clean(product.description),
      programName: clean(product.programName) || clean(product.program),
    })),
    investmentDescription: clean(proposal.investDesc),
    investmentValue: formatCurrencyBRL(proposal.investValue),
    sellerName: clean(seller?.name) || clean(proposal.contactName) || 'Contato do vendedor',
    sellerRole: clean(seller?.jobTitle) || clean(proposal.contactRole) || 'Comercial',
    sellerPhone: clean(seller?.contactPhone) || clean(proposal.contactPhone) || '(00) 00000-0000',
  };
}
