import * as Print from 'expo-print';
import type { Proposal } from '@/src/types';
import { loadProposalPrintAssets } from './proposalPrintAssets';
import { renderProposalPrintHtml } from './proposalPrintHtml';
import { getProposalPrintOptions } from './proposalPrintLayout';
import { mapProposalToPrintData } from './proposalPrintModel';
import { paginateProposalPrintProducts } from './proposalPrintPagination';

export type GeneratedProposalPdf = {
  uri: string;
  numberOfPages: number;
  expectedPageCount: number;
};

export class ProposalPdfLayoutError extends Error {
  readonly expectedPageCount: number;
  readonly actualPageCount: number;

  constructor(expectedPageCount: number, actualPageCount: number) {
    super('The native PDF page count differs from the planned A4 layout');
    this.name = 'ProposalPdfLayoutError';
    this.expectedPageCount = expectedPageCount;
    this.actualPageCount = actualPageCount;
  }
}

export async function generateProposalPdfFile(proposal: Proposal): Promise<GeneratedProposalPdf> {
  const data = mapProposalToPrintData(proposal);
  const pages = paginateProposalPrintProducts(data);
  const { fontFaceCss } = await loadProposalPrintAssets();
  const html = renderProposalPrintHtml({ data, pages, fontFaceCss });
  const result = await Print.printToFileAsync(getProposalPrintOptions(html));
  const expectedPageCount = pages.length;

  if (result.numberOfPages !== expectedPageCount) {
    console.warn('Proposal PDF page count mismatch', {
      expectedPageCount,
      actualPageCount: result.numberOfPages,
    });
    throw new ProposalPdfLayoutError(expectedPageCount, result.numberOfPages);
  }

  return {
    uri: result.uri,
    numberOfPages: result.numberOfPages,
    expectedPageCount,
  };
}

