import { buildProposalFontFaceCss } from '../proposalPrintAssets';

describe('proposal print assets', () => {
  it('embeds all required Montserrat weights without remote URLs', () => {
    const css = buildProposalFontFaceCss({
      400: 'Zm9udC00MDA=',
      500: 'Zm9udC01MDA=',
      600: 'Zm9udC02MDA=',
      700: 'Zm9udC03MDA=',
      800: 'Zm9udC04MDA=',
      900: 'Zm9udC05MDA=',
    });

    expect(css.match(/@font-face/g)).toHaveLength(6);
    expect(css).toContain('data:font/ttf;base64,Zm9udC00MDA=');
    expect(css).toContain('font-weight: 900');
    expect(css).not.toContain('http');
  });
});

