import { makePrintProduct, makePrintProposal } from '@/src/test/fixtures/proposalPrint';
import { mapProposalToPrintData } from '../proposalPrintModel';
import { paginateProposalPrintProducts } from '../proposalPrintPagination';

function pagesFor(productCount: number, withStats = true) {
  const proposal = makePrintProposal({
    stats: withStats ? makePrintProposal().stats : [],
    products: Array.from({ length: productCount }, (_, index) => makePrintProduct(index + 1)),
  });
  return paginateProposalPrintProducts(mapProposalToPrintData(proposal));
}

describe('paginateProposalPrintProducts', () => {
  it.each([0, 1, 2, 4])('keeps %i products with stats in one A4 page', (count) => {
    const pages = pagesFor(count);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ kind: 'single', showHero: true, showInvestment: true, showFooter: true });
  });

  it('moves the fifth product and final blocks to a second page', () => {
    const pages = pagesFor(5);
    expect(pages).toHaveLength(2);
    expect(pages[0].products).toHaveLength(4);
    expect(pages[0].showInvestment).toBe(false);
    expect(pages[1]).toMatchObject({ kind: 'last', showHero: false, showStats: false, showInvestment: true, showFooter: true });
    expect(pages[1].products).toHaveLength(1);
  });

  it('uses the additional first-page space when presentation is absent', () => {
    const pagesWithStats = pagesFor(5, true);
    const pagesWithoutStats = pagesFor(5, false);

    expect(pagesWithStats).toHaveLength(2);
    expect(pagesWithoutStats).toHaveLength(1);
    expect(pagesWithoutStats[0]).toMatchObject({
      kind: 'single',
      showStats: false,
      showInvestment: true,
      showFooter: true,
    });
  });

  it.each([12, 20])('preserves order and includes %i products exactly once', (count) => {
    const pages = pagesFor(count);
    const ids = pages.flatMap((page) => page.products.map((product) => product.id));
    expect(ids).toEqual(Array.from({ length: count }, (_, index) => `product-${index + 1}`));
    expect(pages.every((page) => page.products.length > 0)).toBe(true);
    expect(pages.filter((page) => page.showInvestment)).toHaveLength(1);
    expect(pages.filter((page) => page.showFooter)).toHaveLength(1);
    expect(pages.at(-1)?.showInvestment).toBe(true);
    expect(pages.at(-1)?.showFooter).toBe(true);
    expect(pages.filter((page) => page.showHero)).toHaveLength(1);
    expect(pages.filter((page) => page.showStats)).toHaveLength(1);
    expect(pages[0].showHero).toBe(true);
    expect(pages[0].showStats).toBe(true);
  });
});
