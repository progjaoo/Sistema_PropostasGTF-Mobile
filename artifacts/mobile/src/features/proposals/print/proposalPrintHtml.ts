import type { Proposal } from '@/src/types';

function escape(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function proposalPrintHtml(proposal: Proposal): string {
  const primary = proposal.station?.primaryColor || '#427EFF';
  const client = proposal.advertiser?.tradeName || proposal.clientLine1 || 'Sem cliente';
  const visibleStats = (proposal.stats ?? []).filter((stat) => stat.num || stat.desc);
  const productPages = paginateProducts(proposal.products ?? [], visibleStats.length > 0);
  const pages = productPages.length ? productPages : [[]];
  const stats = visibleStats
    .map((stat) => `<div class="stat"><strong>${escape(stat.num)}${escape(stat.suf)}</strong><small>${escape(stat.desc)}</small></div>`)
    .join('');
  const heroStyle = proposal.bannerBase64
    ? `background-color:${escape(primary)};background-image:linear-gradient(rgba(0,0,0,${Math.max(0, Math.min(90, proposal.overlayOpacity ?? 30)) / 100}),rgba(0,0,0,${Math.max(0, Math.min(90, proposal.overlayOpacity ?? 30)) / 100})),url('${escape(proposal.bannerBase64)}');`
    : `background-color:${escape(primary)};`;

  const pageMarkup = pages
    .map((pageProducts, pageIndex) => {
      const isFirst = pageIndex === 0;
      const isLast = pageIndex === pages.length - 1;
      const products = pageProducts
        .map(
          (product) => {
            const metadata = [product.durationLabel, product.airTime, seasonalityLabel(product.seasonality)].filter(Boolean).map(escape).join(' - ');
            return `<article class="product" style="border-left-color:${escape(primary)}">
        <div class="product-top"><strong class="qty">${escape(product.qty || '01')}</strong><span>QUANTIDADE<br>DE INSERÇÕES</span></div>
        <div>
          <h3>${escape(product.title)}</h3>
          ${metadata ? `<p class="metadata">${metadata}</p>` : ''}
          ${product.detail ? `<p class="detail">${escape(product.detail)}</p>` : ''}
          ${product.description ? `<p>${escape(product.description)}</p>` : ''}
          ${product.program ? `<span class="program-pill">${escape(product.program)}</span>` : ''}
        </div>
      </article>`;
          },
        )
        .join('');

      return `<main class="page${isLast ? ' last-page' : ''}">
        <header>
          ${proposal.station?.logoBase64 ? `<img class="logo" src="${escape(proposal.station.logoBase64)}">` : `<div class="logo-mark" style="background-color:${escape(primary)}">${escape((proposal.station?.name || 'GTF').slice(0, 2).toUpperCase())}</div>`}
          <div>
            <strong>${escape(proposal.station?.name)}</strong><br>
            <small>${escape(isFirst ? proposal.station?.slogan : `${client} - continuacao`)}</small>
          </div>
        </header>
        ${isFirst ? `<section class="hero" style="${heroStyle}"><small>${escape(proposal.propType)}</small><h1>${escape(client).toUpperCase()}</h1>${proposal.showPeriod ? `<div class="period-pill">Periodo: ${escape(formatPeriod(proposal))}</div>${proposal.periodDesc ? `<p class="period-note">${escape(proposal.periodDesc)}</p>` : ''}` : ''}</section>` : ''}
        ${isFirst && stats ? `<div class="section">Apresentacao</div><section class="stats">${stats}</section>` : ''}
        <div class="section">Plano de Ações${isFirst ? '' : ' - continuacao'}</div>
        <section class="products">${products || '<p>Nenhum produto adicionado.</p>'}</section>
        ${isLast ? `<div class="last-page-spacer"></div>
          <section class="investment"><div><span>INVESTIMENTO</span>${proposal.investDesc ? `<small>${escape(proposal.investDesc)}</small>` : ''}</div><strong>${escape(formatInvestment(proposal.investValue))}</strong></section>
          <footer><div><strong>${escape(proposal.contactName || proposal.createdBy?.name)}</strong><br><small>${escape([proposal.contactRole || proposal.createdBy?.jobTitle, proposal.station?.name].filter(Boolean).join(' + '))}</small></div><div><small>CONTATO DIRETO</small><br><strong style="color:${escape(primary)}">${escape(proposal.contactPhone || proposal.createdBy?.contactPhone)}</strong></div></footer>` : ''}
      </main>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
    @page { size: A4; margin: 0; } * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; font-family: Montserrat, Arial, sans-serif; color: #111; background: #fff; }
    .page { width: 210mm; height: 297mm; padding: 10mm 14mm 11mm; display: flex; flex-direction: column; gap: 4.2mm; overflow: hidden; break-after: page; page-break-after: always; background: #fff; }
    .page:last-child { break-after: auto; page-break-after: auto; }
    header { display: flex; align-items: center; gap: 14px; min-height: 17mm; }
    header strong { font-size: 22px; line-height: 1; font-weight: 900; text-transform: uppercase; letter-spacing: .3px; }
    header small { color: #727272; font-size: 12px; font-weight: 500; }
    .logo, .logo-mark { width: 48px; height: 48px; border-radius: 12px; object-fit: contain; }
    .logo-mark { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; }
    .hero { min-height: 48mm; padding: 12mm 11mm 9mm; border-radius: 20px; color: white; background-size: cover; background-position: center; overflow: hidden; }
    .hero small, .section { text-transform: uppercase; letter-spacing: 3px; font-weight: 900; }
    .hero small { display: block; color: rgba(255,255,255,.72); font-size: 11px; margin-bottom: 8px; }
    h1 { font-size: 41px; line-height: .96; margin: 0 0 10mm; max-width: 150mm; font-weight: 900; letter-spacing: 0; }
    .period-pill { display: inline-block; border: 1.5px solid rgba(255,255,255,.86); border-radius: 999px; padding: 8px 16px; font-size: 12px; font-weight: 800; }
    .period-note { color: rgba(255,255,255,.86); max-width: 430px; margin: 7px 0 0; font-size: 10px; }
    .section { display: flex; align-items: center; gap: 8px; font-size: 10px; }
    .section:before { content: ""; display: inline-block; width: 4px; height: 14px; border-radius: 99px; background: ${escape(primary)}; }
    .stats, .products { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
    .stat { min-height: 24mm; padding: 12px 14px; background: #f8fbff; border: 1px solid #dce7f6; border-radius: 14px; break-inside: avoid; box-shadow: inset 96px 5px 0 -92px ${escape(primary)}; }
    .stat strong { display: block; color: ${escape(primary)}; font-size: 25px; line-height: 1; font-weight: 900; } .stat small { display: block; margin-top: 7px; color: #727272; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .product { border-left: 10px solid ${escape(primary)}; display: block; min-height: 88px; max-height: 126px; padding: 12px 13px 11px 16px; background: #f8fbff; border-top: 1px solid #dce7f6; border-right: 1px solid #dce7f6; border-bottom: 1px solid #dce7f6; break-inside: avoid; overflow: hidden; border-radius: 15px; }
    .product-top { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
    .product-top span { color: #727272; font-size: 8.5px; line-height: .94; font-weight: 900; letter-spacing: 1.1px; }
    .qty { color: ${escape(primary)}; font-size: 29px; line-height: .9; font-weight: 900; } h3 { margin: 0 0 5px; font-size: 13px; line-height: 1.12; font-weight: 900; text-transform: uppercase; }
    p { color: #666; margin: 4px 0; font-size: 10.5px; line-height: 1.24; } .metadata { color: #555; text-transform: uppercase; font-weight: 700; letter-spacing: .2px; } .detail { color: #444; font-weight: 600; }
    .program-pill { display: inline-block; margin-top: 5px; padding: 5px 10px; border-radius: 99px; background: #111; color: white; font-size: 8px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
    .last-page-spacer { flex: 1; min-height: 2mm; }
    .investment { background: #000; color: white; border-radius: 19px; padding: 15px 22px; display: flex; justify-content: space-between; align-items: center; break-inside: avoid; min-height: 21mm; }
    .investment span { display:block; letter-spacing: 3px; color: #9a9a9a; font-weight: 900; font-size: 10px; text-transform: uppercase; } .investment small { display:block; margin-top: 4px; max-width: 320px; color: #ddd; font-size: 9px; }
    .investment strong { font-size: 33px; font-weight: 900; } footer { border-top: 1px solid #e1e7f0; padding-top: 10px; display: flex; justify-content: space-between; break-inside: avoid; }
    footer strong { font-size: 18px; font-weight: 900; } footer small { color: #727272; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    footer div:last-child { text-align: right; } footer div:last-child strong { font-size: 14px; }
  </style></head><body>${pageMarkup}</body></html>`;
}

function paginateProducts(products: Proposal['products'], hasStats: boolean): Proposal['products'][] {
  const pages: Proposal['products'][] = [];
  const firstBudget = hasStats ? 250 : 252;
  const nextBudget = 540;
  let index = 0;

  while (index < products.length) {
    const budget = pages.length === 0 ? firstBudget : nextBudget;
    const page: Proposal['products'] = [];
    let used = 0;

    while (index < products.length) {
      const rowItems = products.slice(index, index + 2);
      const rowHeight = Math.max(...rowItems.map(estimateProductHeight));
      const nextUsed = used + rowHeight + (page.length ? 10 : 0);
      if (page.length > 0 && nextUsed > budget) break;
      page.push(...rowItems);
      used = nextUsed;
      index += rowItems.length;
    }

    pages.push(page);
  }

  return pages;
}

function estimateProductHeight(product: Proposal['products'][number]): number {
  const descriptionLength = (product.description ?? '').length;
  const detailLength = (product.detail ?? '').length;
  const metadataCount = [product.durationLabel, product.airTime, product.seasonality].filter(Boolean).length;
  return 108 + Math.ceil(descriptionLength / 55) * 12 + Math.ceil(detailLength / 60) * 10 + (metadataCount ? 10 : 0);
}

function seasonalityLabel(value: Proposal['products'][number]['seasonality']): string {
  if (value === 'MONTHLY') return 'Mensal';
  if (value === 'SEMIANNUAL') return 'Semestral';
  if (value === 'ANNUAL') return 'Anual';
  return '';
}

function formatPeriod(proposal: Proposal): string {
  if (proposal.dateStart || proposal.dateEnd) {
    return [proposal.dateStart, proposal.dateEnd].filter(Boolean).join(' a ');
  }
  return proposal.propMonth || 'Mensal';
}

function formatInvestment(value: string | null | undefined): string {
  const normalized = String(value || '0,00').trim();
  return normalized.startsWith('R$') ? normalized : `R$ ${normalized}`;
}
