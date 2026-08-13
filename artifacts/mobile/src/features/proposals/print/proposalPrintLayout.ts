import type { FilePrintOptions } from 'expo-print';

export const A4_PRINT = {
  widthPt: 595,
  heightPt: 842,
  widthMm: 210,
  heightMm: 297,
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
} as const;

export const PROPOSAL_PRINT_LAYOUT = {
  pageContentHeightMm: 279,
  firstHeaderHeightMm: 19,
  continuationHeaderHeightMm: 19,
  heroHeightMm: 55,
  statsHeightMm: 31.5,
  productsLabelHeightMm: 6.5,
  productsSectionMarginBottomMm: 5,
  productCardHeightMm: 39,
  productRowGapMm: 4,
  investmentHeightMm: 23,
  footerHeightMm: 16,
} as const;

export function getProposalPrintOptions(html: string): FilePrintOptions {
  return {
    html,
    width: A4_PRINT.widthPt,
    height: A4_PRINT.heightPt,
    margins: A4_PRINT.margins,
    useMarkupFormatter: false,
    textZoom: 100,
  };
}

