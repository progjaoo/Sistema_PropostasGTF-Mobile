import { useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Proposal } from '@/src/types';
import { proposalPrintHtml } from './proposalPrintHtml';

export function useProposalPdf() {
  const [isGenerating, setIsGenerating] = useState(false);

  async function shareProposalPdf(proposal: Proposal) {
    setIsGenerating(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: proposalPrintHtml(proposal) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar proposta',
          UTI: 'com.adobe.pdf',
        });
      }
      return uri;
    } finally {
      setIsGenerating(false);
    }
  }

  return { isGenerating, shareProposalPdf };
}

