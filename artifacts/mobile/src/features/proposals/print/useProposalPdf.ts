import { useRef, useState } from 'react';
import * as Sharing from 'expo-sharing';
import type { Proposal } from '@/src/types';
import { generateProposalPdfFile } from './generateProposalPdfFile';

export function useProposalPdf() {
  const [isGenerating, setIsGenerating] = useState(false);
  const generationInProgress = useRef(false);

  async function shareProposalPdf(proposal: Proposal) {
    if (generationInProgress.current) return null;
    generationInProgress.current = true;
    setIsGenerating(true);
    try {
      const { uri } = await generateProposalPdfFile(proposal);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar proposta',
          UTI: 'com.adobe.pdf',
        });
      }
      return uri;
    } finally {
      generationInProgress.current = false;
      setIsGenerating(false);
    }
  }

  return { isGenerating, shareProposalPdf };
}

