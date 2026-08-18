import { makePrintProduct, makePrintProposal } from '@/src/test/fixtures/proposalPrint';
import { mapProposalToPrintData } from '../proposalPrintModel';
import { paginateProposalPrintProducts } from '../proposalPrintPagination';
import { renderProposalPrintHtml } from '../proposalPrintHtml';

describe('renderProposalPrintHtml', () => {
  it('keeps four presentation cards isolated with long unbroken content', () => {
    const proposal = makePrintProposal({
      stats: Array.from({ length: 4 }, (_, index) => ({ num: `${index}${'9'.repeat(39)}`, suf: '', desc: 'PALAVRA'.repeat(20) })),
    });
    const data = mapProposalToPrintData(proposal);
    const html = renderProposalPrintHtml({ data, pages: paginateProposalPrintProducts(data), fontFaceCss: '' });
    expect(html).toContain('overflow-wrap: anywhere');
    expect(html.match(/proposal-print-stat-card/g)?.length).toBeGreaterThanOrEqual(4);
  });
  it('renders the web parity fixture as one explicit A4 page', () => {
    const data = mapProposalToPrintData(makePrintProposal());
    const pages = paginateProposalPrintProducts(data);
    const html = renderProposalPrintHtml({ data, pages, fontFaceCss: '@font-face { font-family: Montserrat; }' });

    expect(html.match(/<main class="proposal-print-page/g)).toHaveLength(1);
    expect(html).toContain('width: 210mm');
    expect(html).toContain('height: 297mm');
    expect(html).toContain('background-color:#427EFF');
    expect(html).toContain('<img src="data:image/png;base64,aGVsbG8="');
    expect(html).toContain('Leonardo Salles');
    expect(html).not.toContain('Contato legado');
    expect(html.match(/proposal-print-investment/g)?.length).toBeGreaterThan(0);
    expect(html.match(/<footer class="proposal-print-footer"/g)).toHaveLength(1);
  });

  it('does not depend on remote fonts and escapes proposal content', () => {
    const data = mapProposalToPrintData(makePrintProposal({
      advertiser: { ...makePrintProposal().advertiser!, tradeName: '<Cliente & Parceiro>' },
    }));
    const html = renderProposalPrintHtml({
      data,
      pages: paginateProposalPrintProducts(data),
      fontFaceCss: '@font-face { font-family: Montserrat; src: url(data:font/ttf;base64,Zm9udA==); }',
    });

    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).toContain('&lt;CLIENTE &amp; PARCEIRO&gt;');
    expect(html).not.toContain('<CLIENTE & PARCEIRO>');
  });

  it('keeps a short proposal without presentation and its final blocks on one page', () => {
    const data = mapProposalToPrintData(makePrintProposal({
      stats: [],
      products: [makePrintProduct(1)],
    }));
    const html = renderProposalPrintHtml({
      data,
      pages: paginateProposalPrintProducts(data),
      fontFaceCss: '',
    });

    expect(html.match(/<main class="proposal-print-page/g)).toHaveLength(1);
    expect(html).not.toContain('APRESENTACAO');
    expect(html.match(/proposal-print-investment/g)?.length).toBeGreaterThan(0);
    expect(html.match(/<footer class="proposal-print-footer"/g)).toHaveLength(1);
  });

  it('keeps long product content inside the deterministic four-card first page', () => {
    const longTitle = 'Produto especial com titulo comercial propositalmente extenso';
    const longDescription = 'Descricao extensa para validar o limite visual do card sem alterar a decisao de paginacao baseada em linhas fisicas. '.repeat(4);
    const data = mapProposalToPrintData(makePrintProposal({
      products: Array.from({ length: 4 }, (_, index) => makePrintProduct(index + 1, {
        title: longTitle,
        description: longDescription,
      })),
    }));
    const pages = paginateProposalPrintProducts(data);
    const html = renderProposalPrintHtml({ data, pages, fontFaceCss: '' });

    expect(pages).toHaveLength(1);
    expect(html.match(/class="proposal-print-product-card"/g)).toHaveLength(4);
    expect(html).toContain(longTitle);
    expect(html).toContain('text-transform: uppercase');
  });
});
