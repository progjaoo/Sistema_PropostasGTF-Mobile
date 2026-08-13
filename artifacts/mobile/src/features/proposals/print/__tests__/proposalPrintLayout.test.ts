import { A4_PRINT, getProposalPrintOptions } from '../proposalPrintLayout';

describe('proposal print layout', () => {
  it('uses physical A4 dimensions instead of Expo Letter defaults', () => {
    expect(A4_PRINT).toMatchObject({ widthPt: 595, heightPt: 842, widthMm: 210, heightMm: 297 });
    expect(getProposalPrintOptions('<html />')).toEqual({
      html: '<html />',
      width: 595,
      height: 842,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      useMarkupFormatter: false,
      textZoom: 100,
    });
  });
});

