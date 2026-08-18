import type { Proposal } from '@/src/types';
import { mapProposalToPrintData, type ProposalPrintData, type ProposalPrintProduct } from './proposalPrintModel';
import { paginateProposalPrintProducts, type ProposalPrintPage } from './proposalPrintPagination';

type RenderProposalPrintHtmlInput = {
  data: ProposalPrintData;
  pages: ProposalPrintPage[];
  fontFaceCss: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stationMonogram(name: string): string {
  const digits = name.match(/\d+/)?.[0];
  if (digits) return digits.slice(0, 3);
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'E';
}

function renderHeader(data: ProposalPrintData, continuation: boolean): string {
  const logo = data.stationLogoDataUrl
    ? `<img src="${escapeHtml(data.stationLogoDataUrl)}" alt="Logo da empresa">`
    : escapeHtml(stationMonogram(data.stationName));
  return `<header class="proposal-print-header">
    <div class="proposal-print-logo" style="background-color:${escapeHtml(data.primaryColor)}">${logo}</div>
    <div>
      <div class="proposal-print-station-name">${escapeHtml(data.stationName)}</div>
      <div class="proposal-print-slogan">${escapeHtml(data.stationSlogan)}${continuation ? ' <span>- CONTINUACAO</span>' : ''}</div>
    </div>
  </header>`;
}

function renderHero(data: ProposalPrintData): string {
  return `<section class="proposal-print-hero" style="background-color:${escapeHtml(data.primaryColor)}">
    <div class="proposal-print-hero-type">${escapeHtml(data.proposalTypeName)}</div>
    <h1>${escapeHtml(data.clientName.toUpperCase())}</h1>
    ${data.showPeriod && data.periodLabel ? `<div class="proposal-print-period-row"><div class="proposal-print-period-pill">Periodo: ${escapeHtml(data.periodLabel)}</div></div>` : ''}
  </section>`;
}

function renderSectionLabel(data: ProposalPrintData, label: string, continuation = false): string {
  return `<div class="proposal-print-section-label">
    <span style="background-color:${escapeHtml(data.primaryColor)}"></span>
    <strong>${escapeHtml(label)}${continuation ? '<em>Continuacao</em>' : ''}</strong>
  </div>`;
}

function renderStats(data: ProposalPrintData): string {
  if (data.stats.length === 0) return '';
  const cards = data.stats.map((stat, index) => {
    const accent = index % 2 === 0 ? data.primaryColor : '#727272';
    return `<div class="proposal-print-stat-card">
      <div class="proposal-print-stat-bar" style="background-color:${escapeHtml(accent)}"></div>
      <div class="proposal-print-stat-body">
        <div class="proposal-print-stat-value" style="color:${escapeHtml(accent)}">${escapeHtml(stat.value || '00')}</div>
        <div class="proposal-print-stat-description">${escapeHtml(stat.description || 'Indicador')}</div>
      </div>
    </div>`;
  }).join('');
  return `<section class="proposal-print-stats-section">
    ${renderSectionLabel(data, 'Apresentacao')}
    <div class="proposal-print-stats-grid">${cards}</div>
  </section>`;
}

function renderProduct(data: ProposalPrintData, product: ProposalPrintProduct): string {
  return `<article class="proposal-print-product-card" style="border-left-color:${escapeHtml(data.primaryColor)}">
    <div class="proposal-print-product-top">
      <div class="proposal-print-product-qty" style="color:${escapeHtml(data.primaryColor)}">${escapeHtml(product.quantity)}</div>
      <div class="proposal-print-product-qty-label">Quantidade<br>de insercoes</div>
    </div>
    <div class="proposal-print-product-title">${escapeHtml(product.title)}</div>
    ${product.metadata ? `<div class="proposal-print-product-meta">${escapeHtml(product.metadata)}</div>` : ''}
    ${product.description ? `<p class="proposal-print-product-description">${escapeHtml(product.description)}</p>` : ''}
    ${product.programName ? `<div class="proposal-print-product-tags"><span class="proposal-print-product-program">${escapeHtml(product.programName)}</span></div>` : ''}
  </article>`;
}

function renderProducts(data: ProposalPrintData, page: ProposalPrintPage, continuation: boolean): string {
  const content = page.products.length
    ? `<div class="proposal-print-products-grid">${page.products.map((product) => renderProduct(data, product)).join('')}</div>`
    : '<div class="proposal-print-empty-products">Nenhum produto adicionado.</div>';
  return `<section class="proposal-print-products-section">
    ${renderSectionLabel(data, 'Plano de Acoes', continuation)}
    ${content}
  </section>`;
}

function renderInvestment(data: ProposalPrintData): string {
  return `<section class="proposal-print-investment">
    <div>
      <div class="proposal-print-investment-label">Investimento</div>
      ${data.investmentDescription ? `<div class="proposal-print-investment-description">${escapeHtml(data.investmentDescription)}</div>` : ''}
    </div>
    <div class="proposal-print-investment-value">${escapeHtml(data.investmentValue)}</div>
  </section>`;
}

function renderFooter(data: ProposalPrintData): string {
  return `<footer class="proposal-print-footer">
    <div>
      <div class="proposal-print-footer-name">${escapeHtml(data.sellerName)}</div>
      <div class="proposal-print-footer-role">${escapeHtml(data.sellerRole)} - ${escapeHtml(data.stationName)}</div>
    </div>
    <div class="proposal-print-footer-contact">
      <div class="proposal-print-footer-label">Contato Direto</div>
      <div class="proposal-print-footer-phone" style="color:${escapeHtml(data.primaryColor)}">${escapeHtml(data.sellerPhone)}</div>
    </div>
  </footer>`;
}

function renderPage(data: ProposalPrintData, page: ProposalPrintPage, pageIndex: number, pageCount: number): string {
  const continuation = page.kind === 'continuation' || page.kind === 'last';
  return `<main class="proposal-print-page proposal-print-page--${page.kind}" data-page="${pageIndex + 1}" data-page-count="${pageCount}">
    ${renderHeader(data, continuation)}
    ${page.showHero ? renderHero(data) : ''}
    ${page.showStats ? renderStats(data) : ''}
    ${renderProducts(data, page, continuation)}
    ${page.showInvestment ? '<div class="proposal-print-spacer"></div>' : ''}
    ${page.showInvestment ? renderInvestment(data) : ''}
    ${page.showFooter ? renderFooter(data) : ''}
  </main>`;
}

export function renderProposalPrintHtml({ data, pages, fontFaceCss }: RenderProposalPrintHtmlInput): string {
  const pageMarkup = pages.map((page, index) => renderPage(data, page, index, pages.length)).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    ${fontFaceCss}
    @page { size: A4 portrait; margin: 0; }
    html, body { width: 210mm; margin: 0; padding: 0; background: #fff; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { color: #111; font-family: 'Montserrat', Arial, sans-serif; }
    .proposal-print-page { display: flex; flex-direction: column; width: 210mm; height: 297mm; min-height: 297mm; max-height: 297mm; padding: 10mm 14mm 8mm; overflow: hidden; background: #fff; break-after: page; page-break-after: always; page-break-inside: avoid; break-inside: avoid; }
    .proposal-print-page:last-child { break-after: auto; page-break-after: auto; }
    .proposal-print-header { display: flex; align-items: center; gap: 10px; min-height: 14mm; margin-bottom: 5mm; }
    .proposal-print-logo { display: flex; align-items: center; justify-content: center; width: 13.5mm; height: 13.5mm; border-radius: 4mm; overflow: hidden; color: #fff; font-size: 14pt; font-weight: 900; }
    .proposal-print-logo img { width: 100%; height: 100%; object-fit: contain; padding: 2mm; }
    .proposal-print-station-name { color: #111; font-size: 16pt; font-weight: 900; line-height: 1; text-transform: uppercase; letter-spacing: .03em; }
    .proposal-print-slogan { margin-top: 1.8mm; color: #727272; font-size: 8.5pt; font-weight: 500; }
    .proposal-print-hero { min-height: 50mm; margin-bottom: 5mm; padding: 9mm 12mm; border-radius: 16px; color: #fff; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    .proposal-print-hero-type { color: rgba(255,255,255,.75); font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: .24em; }
    .proposal-print-hero h1 { max-width: 160mm; max-height: 28mm; margin: 4mm 0 0; overflow: hidden; color: #fff; font-size: 34pt; font-weight: 900; line-height: .92; text-transform: uppercase; letter-spacing: 0; }
    .proposal-print-period-row { display: flex; align-items: center; margin-top: 6mm; }
    .proposal-print-period-pill { border: 1px solid rgba(255,255,255,.9); border-radius: 999px; padding: 2mm 5mm; color: #fff; font-size: 8.5pt; font-weight: 800; }
    .proposal-print-section-label { display: flex; align-items: center; gap: 2.5mm; margin-bottom: 3mm; }
    .proposal-print-section-label > span { display: block; width: 1mm; height: 3.5mm; border-radius: 999px; }
    .proposal-print-section-label strong { display: flex; align-items: baseline; gap: 2mm; color: #111; font-size: 7.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: .22em; }
    .proposal-print-section-label em { color: #727272; font-size: 6.5pt; font-style: normal; letter-spacing: .12em; }
    .proposal-print-stats-section { margin-bottom: 5mm; break-inside: avoid; page-break-inside: avoid; }
    .proposal-print-stats-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); min-width: 0; overflow: hidden; min-height: 20mm; background: #f8fbff; border: 1px solid #e1e7f0; border-radius: 12px; }
    .proposal-print-stat-card { min-width: 0; overflow-wrap: anywhere; border-right: 1px solid #e1e7f0; }
    .proposal-print-stat-card:last-child { border-right: 0; }
    .proposal-print-stat-bar { height: 1.5mm; }
    .proposal-print-stat-body { min-width: 0; padding: 3.2mm 4mm; }
    .proposal-print-stat-value { min-width: 0; overflow-wrap: anywhere; font-size: 20pt; font-weight: 900; line-height: 1; }
    .proposal-print-stat-description { min-width: 0; margin-top: 2mm; overflow-wrap: anywhere; color: #555; font-size: 6.8pt; font-weight: 800; line-height: 1.18; text-transform: uppercase; letter-spacing: .08em; white-space: pre-line; }
    .proposal-print-products-section { margin-bottom: 5mm; }
    .proposal-print-products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .proposal-print-product-card { min-width: 0; min-height: 37mm; max-height: 39mm; padding: 4mm 4.5mm 3.5mm 6mm; overflow: hidden; overflow-wrap: anywhere; background: #f8fbff; border: 1px solid #dce7f6; border-left: 10px solid; border-radius: 16px; break-inside: avoid; page-break-inside: avoid; }
    .proposal-print-product-top { display: flex; align-items: flex-start; gap: 2.5mm; margin-bottom: 2.2mm; }
    .proposal-print-product-qty { font-size: 24pt; font-weight: 900; line-height: 1; }
    .proposal-print-product-qty-label { padding-top: 1mm; color: #727272; font-size: 6.7pt; font-weight: 900; line-height: 1.1; text-transform: uppercase; letter-spacing: .12em; }
    .proposal-print-product-title { color: #111; font-size: 9.5pt; font-weight: 900; line-height: 1.15; text-transform: uppercase; }
    .proposal-print-product-meta { margin-top: 1.3mm; color: #565656; font-size: 7.5pt; font-weight: 700; line-height: 1.2; text-transform: uppercase; letter-spacing: .02em; }
    .proposal-print-product-description { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; margin: 1.6mm 0 0; overflow: hidden; color: #565656; font-size: 7.8pt; line-height: 1.18; }
    .proposal-print-product-tags { display: flex; margin-top: 2.5mm; }
    .proposal-print-product-program { display: inline-flex; max-width: 100%; align-items: center; padding: 1.2mm 3.2mm; overflow: hidden; background: #111; border-radius: 999px; color: #fff; font-size: 6.3pt; font-weight: 900; line-height: 1; text-transform: uppercase; letter-spacing: .12em; white-space: nowrap; text-overflow: ellipsis; }
    .proposal-print-empty-products { padding: 9mm 8mm; background: #f8fbff; border: 1px dashed #dce7f6; border-radius: 16px; color: #727272; font-size: 10pt; font-weight: 600; text-align: center; }
    .proposal-print-spacer { flex: 1; min-height: 0; }
    .proposal-print-investment { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 6mm; min-height: 18mm; margin-bottom: 5mm; padding: 5mm 8mm; background: #000; border-radius: 16px; color: #fff; break-inside: avoid; page-break-inside: avoid; }
    .proposal-print-investment-label { color: rgba(255,255,255,.55); font-size: 7.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: .24em; }
    .proposal-print-investment-description { max-width: 96mm; margin-top: 2mm; color: rgba(255,255,255,.74); font-size: 8pt; font-weight: 500; line-height: 1.25; }
    .proposal-print-investment-value { color: #fff; font-size: 27pt; font-weight: 900; line-height: 1; text-align: right; white-space: nowrap; }
    .proposal-print-footer { display: flex; align-items: flex-end; justify-content: space-between; min-height: 12mm; padding-top: 4mm; border-top: 1px solid #e1e7f0; break-inside: avoid; page-break-inside: avoid; }
    .proposal-print-footer-name { color: #111; font-size: 14pt; font-weight: 900; line-height: 1; }
    .proposal-print-footer-role { margin-top: 1.8mm; color: #727272; font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .proposal-print-footer-contact { text-align: right; }
    .proposal-print-footer-label { color: #727272; font-size: 6.8pt; font-weight: 900; text-transform: uppercase; letter-spacing: .18em; }
    .proposal-print-footer-phone { margin-top: 1.8mm; font-size: 11pt; font-weight: 900; }
  </style></head><body>${pageMarkup}</body></html>`;
}

export function proposalPrintHtml(proposal: Proposal, fontFaceCss = ''): string {
  const data = mapProposalToPrintData(proposal);
  return renderProposalPrintHtml({ data, pages: paginateProposalPrintProducts(data), fontFaceCss });
}
