import type { ProposalPrintData, ProposalPrintProduct } from './proposalPrintModel';
import { PROPOSAL_PRINT_LAYOUT } from './proposalPrintLayout';

export type ProposalPrintPageKind = 'single' | 'first' | 'continuation' | 'last';

export type ProposalPrintPage = {
  kind: ProposalPrintPageKind;
  products: ProposalPrintProduct[];
  startIndex: number;
  showHero: boolean;
  showStats: boolean;
  showInvestment: boolean;
  showFooter: boolean;
};

function gridHeight(productCount: number): number {
  if (productCount <= 0) return 24;
  const rowCount = Math.ceil(productCount / 2);
  return rowCount * PROPOSAL_PRINT_LAYOUT.productCardHeightMm
    + Math.max(0, rowCount - 1) * PROPOSAL_PRINT_LAYOUT.productRowGapMm;
}

function reservedHeight(options: { firstPage: boolean; finalPage: boolean; hasStats: boolean }): number {
  const header = options.firstPage
    ? PROPOSAL_PRINT_LAYOUT.firstHeaderHeightMm
    : PROPOSAL_PRINT_LAYOUT.continuationHeaderHeightMm;
  const intro = options.firstPage
    ? PROPOSAL_PRINT_LAYOUT.heroHeightMm + (options.hasStats ? PROPOSAL_PRINT_LAYOUT.statsHeightMm : 0)
    : 0;
  const finalBlocks = options.finalPage
    ? PROPOSAL_PRINT_LAYOUT.investmentHeightMm + PROPOSAL_PRINT_LAYOUT.footerHeightMm
    : 0;

  return header
    + intro
    + PROPOSAL_PRINT_LAYOUT.productsLabelHeightMm
    + PROPOSAL_PRINT_LAYOUT.productsSectionMarginBottomMm
    + finalBlocks;
}

function maxProductsThatFit(maxCount: number, reservedHeightMm: number): number {
  const availableHeight = Math.max(0, PROPOSAL_PRINT_LAYOUT.pageContentHeightMm - reservedHeightMm);
  let count = 0;
  for (let candidate = 1; candidate <= maxCount; candidate += 1) {
    if (gridHeight(candidate) <= availableHeight) count = candidate;
    else break;
  }
  return count || Math.min(1, maxCount);
}

export function paginateProposalPrintProducts(data: ProposalPrintData): ProposalPrintPage[] {
  const products = data.products;
  const hasStats = data.stats.length > 0;

  if (products.length === 0) {
    return [{
      kind: 'single',
      products: [],
      startIndex: 0,
      showHero: true,
      showStats: hasStats,
      showInvestment: true,
      showFooter: true,
    }];
  }

  const firstFinalCount = maxProductsThatFit(
    products.length,
    reservedHeight({ firstPage: true, finalPage: true, hasStats }),
  );
  if (firstFinalCount >= products.length) {
    return [{
      kind: 'single',
      products,
      startIndex: 0,
      showHero: true,
      showStats: hasStats,
      showInvestment: true,
      showFooter: true,
    }];
  }

  const pages: ProposalPrintPage[] = [];
  const firstCount = Math.max(1, Math.min(
    products.length - 1,
    maxProductsThatFit(
      products.length - 1,
      reservedHeight({ firstPage: true, finalPage: false, hasStats }),
    ),
  ));
  pages.push({
    kind: 'first',
    products: products.slice(0, firstCount),
    startIndex: 0,
    showHero: true,
    showStats: hasStats,
    showInvestment: false,
    showFooter: false,
  });

  let index = firstCount;
  while (index < products.length) {
    const remaining = products.length - index;
    const finalCount = maxProductsThatFit(
      remaining,
      reservedHeight({ firstPage: false, finalPage: true, hasStats: false }),
    );
    if (finalCount >= remaining) {
      pages.push({
        kind: 'last',
        products: products.slice(index),
        startIndex: index,
        showHero: false,
        showStats: false,
        showInvestment: true,
        showFooter: true,
      });
      break;
    }

    const continuationCount = Math.max(1, Math.min(
      remaining - 1,
      maxProductsThatFit(
        remaining - 1,
        reservedHeight({ firstPage: false, finalPage: false, hasStats: false }),
      ),
    ));
    pages.push({
      kind: 'continuation',
      products: products.slice(index, index + continuationCount),
      startIndex: index,
      showHero: false,
      showStats: false,
      showInvestment: false,
      showFooter: false,
    });
    index += continuationCount;
  }

  return pages;
}

