import * as Print from 'expo-print';
import type { Proposal } from '@/src/types';
import { makePrintProduct, makePrintProposal } from '@/src/test/fixtures/proposalPrint';
import { loadProposalPrintAssets } from '../proposalPrintAssets';
import { generateProposalPdfFile, ProposalPdfLayoutError } from '../generateProposalPdfFile';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('../proposalPrintAssets', () => ({ loadProposalPrintAssets: jest.fn() }));

const printMock = Print.printToFileAsync as jest.MockedFunction<typeof Print.printToFileAsync>;
const assetsMock = loadProposalPrintAssets as jest.MockedFunction<typeof loadProposalPrintAssets>;

describe('generateProposalPdfFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    assetsMock.mockResolvedValue({ fontFaceCss: '@font-face { font-family: Montserrat; }' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates an A4 file and validates its planned page count', async () => {
    printMock.mockResolvedValue({ uri: 'file:///proposal.pdf', numberOfPages: 1 });

    const result = await generateProposalPdfFile(makePrintProposal());

    expect(result).toEqual({ uri: 'file:///proposal.pdf', numberOfPages: 1, expectedPageCount: 1 });
    expect(printMock).toHaveBeenCalledWith(expect.objectContaining({
      width: 595,
      height: 842,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      useMarkupFormatter: false,
      textZoom: 100,
      html: expect.stringContaining('proposal-print-page--single'),
    }));
  });

  it('rejects a native PDF with a page count different from the paginator', async () => {
    printMock.mockResolvedValue({ uri: 'file:///broken.pdf', numberOfPages: 2 });

    await expect(generateProposalPdfFile(makePrintProposal())).rejects.toEqual(
      expect.objectContaining<Partial<ProposalPdfLayoutError>>({
        name: 'ProposalPdfLayoutError',
        expectedPageCount: 1,
        actualPageCount: 2,
      }),
    );
  });

  it('supports multi-page documents without losing the final blocks', async () => {
    const proposal: Proposal = makePrintProposal({
      products: Array.from({ length: 5 }, (_, index) => makePrintProduct(index + 1)),
    });
    printMock.mockResolvedValue({ uri: 'file:///proposal-2-pages.pdf', numberOfPages: 2 });

    const result = await generateProposalPdfFile(proposal);
    const html = printMock.mock.calls[0]?.[0]?.html ?? '';

    expect(result.expectedPageCount).toBe(2);
    expect(html.match(/<main class="proposal-print-page/g)).toHaveLength(2);
    expect(html.match(/<footer class="proposal-print-footer"/g)).toHaveLength(1);
  });
});
